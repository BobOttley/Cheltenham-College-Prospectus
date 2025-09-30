const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();

// Use environment port or fallback to 3000
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://personalised_prospectus_db_tapg_user:3uNIuUoZ40YHTcGvVQb8UdtHDJEFHEI6@dpg-d2hhm0odl3ps738bve7g-a.frankfurt-postgres.render.com/personalised_prospectus_db_tapg',
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else {
        console.log('✅ Database connected successfully');
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve enquiry form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'enquiry-form.html'));
});

// Generate inquiry ID
function generateInquiryId() {
    return 'INQ-' + Date.now().toString() + Math.floor(Math.random() * 1000);
}

// Transform form data
function transformFormData(formData) {
    const stageMap = {
        'lower': 'Lower', '13-14': 'Lower', '13–14': 'Lower',
        'upper': 'Upper', '16-18': 'Upper', '16–18': 'Upper',
        'senior': 'Senior'
    };

    const boardingMap = {
        'full boarding': 'Full Boarding',
        'boarding': 'Full Boarding',
        'boarder': 'Full Boarding',
        'day': 'Day',
        'considering': 'Considering Both',
        'considering both': 'Considering Both'
    };

    const norm = (v = '') => v.toString().trim().toLowerCase();
    const stageIn = formData.stage || 'Lower';
    const stage = stageMap[norm(stageIn)] || (['Lower', 'Upper', 'Senior'].includes(stageIn) ? stageIn : 'Lower');

    const genderRaw = (formData.gender || '').toString().trim().toLowerCase();
    const gender = genderRaw.startsWith('f') ? 'female' : genderRaw.startsWith('m') ? 'male' : '';

    const bpIn = formData.boardingPreference || '';
    const bpNorm = boardingMap[norm(bpIn)] || (['Full Boarding', 'Day', 'Considering Both'].includes(bpIn) ? bpIn : '');

    const toInt = (x, d = 2) => {
        const n = parseInt(x, 10);
        return Number.isFinite(n) ? Math.max(1, Math.min(3, n)) : d;
    };

    return {
        childName: formData.childName || '',
        parentName: formData.parentName || '',
        familyName: formData.familyName || (formData.parentName ? `the ${formData.parentName.split(' ').pop()} family` : ''),
        email: formData.email || '',
        phone: formData.phone || '',
        stage,
        gender,
        boardingPreference: bpNorm,
        academicInterests: Array.isArray(formData.academicInterests) ? formData.academicInterests : (formData.academicInterests ? [formData.academicInterests] : []),
        activities: Array.isArray(formData.activities) ? formData.activities : (formData.activities ? [formData.activities] : []),
        specificSports: Array.isArray(formData.specificSports) ? formData.specificSports : [],
        universityAspirations: formData.universityAspirations || '',
        priorities: {
            academic: toInt(formData.priorities?.academic || formData.academic, 2),
            sports: toInt(formData.priorities?.sports || formData.sports, 2),
            pastoral: toInt(formData.priorities?.pastoral || formData.pastoral, 2),
            activities: toInt(formData.priorities?.activities || formData.activities, 2)
        },
        additionalInfo: formData.additionalInfo || ''
    };
}

function calculateEntryYear(stage) {
    const currentYear = new Date().getFullYear();
    return stage === 'Lower' || stage === 'Upper' ? (currentYear + 1).toString() : currentYear.toString();
}

// SAVE TO DATABASE (updated!)
app.post('/api/submit-enquiry', async (req, res) => {
    console.log('=== NEW ENQUIRY RECEIVED ===');
    
    try {
        const enquiryId = generateInquiryId();
        const transformedData = transformFormData(req.body);

        const formData = {
            stage: transformedData.stage,
            gender: transformedData.gender,
            boardingPreference: transformedData.boardingPreference,
            academicInterests: transformedData.academicInterests,
            activities: transformedData.activities,
            specificSports: transformedData.specificSports,
            priorities: transformedData.priorities,
            universityAspirations: transformedData.universityAspirations,
            additionalInfo: transformedData.additionalInfo
        };

        // Insert into PostgreSQL
        const query = `
            INSERT INTO inquiries (
                id, first_name, family_surname, parent_email, parent_name,
                contact_number, age_group, entry_year, school, form_data,
                created_at, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
            RETURNING id
        `;

        const values = [
            enquiryId,
            transformedData.childName,
            transformedData.familyName || 'Family',
            transformedData.email,
            transformedData.parentName,
            transformedData.phone,
            transformedData.stage,
            calculateEntryYear(transformedData.stage),
            'cheltenham',
            JSON.stringify(formData),
            'new'
        ];

        await pool.query(query, values);
        
        console.log(`✅ Saved: ${transformedData.childName} (${transformedData.email})`);
        
        res.json({
            success: true,
            enquiryId: enquiryId,
            prospectusURL: `/prospectus?id=${enquiryId}`
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: 'Failed to save enquiry' });
    }
});

// GET ENQUIRY FROM DATABASE (updated!)
app.get('/api/enquiry/:id', async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                first_name as "childName",
                family_surname as "familyName",
                parent_email as email,
                parent_name as "parentName",
                contact_number as phone,
                form_data,
                created_at
            FROM inquiries
            WHERE id = $1 AND school = 'cheltenham'
        `;
        
        const result = await pool.query(query, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Enquiry not found' });
        }

        const row = result.rows[0];
        const formData = row.form_data || {};
        
        const responseData = {
            id: row.id,
            childName: row.childName,
            familyName: row.familyName,
            parentName: row.parentName,
            email: row.email,
            phone: row.phone,
            stage: formData.stage,
            gender: formData.gender,
            boardingPreference: formData.boardingPreference,
            academicInterests: formData.academicInterests || [],
            activities: formData.activities || [],
            specificSports: formData.specificSports || [],
            priorities: formData.priorities || {},
            universityAspirations: formData.universityAspirations || '',
            additionalInfo: formData.additionalInfo || '',
            timestamp: row.created_at
        };

        res.json({ success: true, data: responseData });
        
    } catch (error) {
        console.error('❌ Error fetching enquiry:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch enquiry' });
    }
});

// Serve prospectus
app.get('/prospectus', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ENHANCED ADMIN DASHBOARD - Shows prospectus links
app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Cheltenham College - Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
        .header { background: #1a1a4e; color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header p { opacity: 0.8; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 32px; font-weight: bold; color: #c9a961; margin-bottom: 5px; }
        .stat-label { color: #666; font-size: 14px; }
        .table-container { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; color: #1a1a4e; border-bottom: 2px solid #e9ecef; position: sticky; top: 0; }
        td { padding: 12px; border-bottom: 1px solid #e9ecef; }
        tr:hover { background: #f8f9fa; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .badge-new { background: #d4edda; color: #155724; }
        .badge-boarding { background: #cfe2ff; color: #084298; }
        .badge-day { background: #fff3cd; color: #664d03; }
        .refresh-btn { background: #c9a961; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-bottom: 20px; }
        .refresh-btn:hover { background: #b8975a; }
        .prospectus-link { 
            display: inline-block;
            background: #1a1a4e; 
            color: white; 
            padding: 6px 12px; 
            border-radius: 4px; 
            text-decoration: none; 
            font-size: 12px;
            font-weight: 500;
        }
        .prospectus-link:hover { background: #2a2a5e; }
        .id-cell { font-family: monospace; font-size: 11px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Cheltenham College Enquiries</h1>
        <p>Admin Dashboard - Click "View Prospectus" to see each family's personalised prospectus</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-value" id="totalCount">-</div>
            <div class="stat-label">Total Enquiries</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="todayCount">-</div>
            <div class="stat-label">Today</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="weekCount">-</div>
            <div class="stat-label">This Week</div>
        </div>
    </div>

    <div class="table-container">
        <button class="refresh-btn" onclick="load()">🔄 Refresh</button>
        <div id="content">Loading enquiries...</div>
    </div>

    <script>
        async function load() {
            document.getElementById('content').innerHTML = '<p style="padding:20px;text-align:center;color:#666;">Loading...</p>';
            
            try {
                const response = await fetch('/api/admin/enquiries');
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Failed to load');
                }

                const enquiries = data.enquiries;
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

                // Stats
                const todayCount = enquiries.filter(e => new Date(e.created_at) >= today).length;
                const weekCount = enquiries.filter(e => new Date(e.created_at) >= weekAgo).length;

                document.getElementById('totalCount').textContent = enquiries.length;
                document.getElementById('todayCount').textContent = todayCount;
                document.getElementById('weekCount').textContent = weekCount;

                // Table
                let html = \`
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Child Name</th>
                                <th>Family</th>
                                <th>Email</th>
                                <th>Age</th>
                                <th>Boarding</th>
                                <th>Interests</th>
                                <th>Prospectus</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;

                enquiries.forEach(e => {
                    const date = new Date(e.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                    const time = new Date(e.created_at).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const interests = e.interests ? e.interests.slice(0,3).join(', ') : '-';
                    const boardingClass = e.boarding?.includes('Boarding') ? 'boarding' : 'day';
                    
                    // Build prospectus URL
                    const prospectusUrl = \`/prospectus?id=\${e.id}\`;
                    
                    html += \`
                        <tr>
                            <td>
                                <strong>\${date}</strong><br>
                                <span style="font-size:11px;color:#666;">\${time}</span>
                            </td>
                            <td><strong>\${e.first_name}</strong></td>
                            <td>\${e.family_surname}</td>
                            <td>\${e.parent_email}</td>
                            <td>\${e.age_group}</td>
                            <td><span class="badge badge-\${boardingClass}">\${e.boarding || '-'}</span></td>
                            <td style="font-size:12px;">\${interests}</td>
                            <td>
                                <a href="\${prospectusUrl}" target="_blank" class="prospectus-link">
                                    📄 View Prospectus
                                </a>
                                <div class="id-cell" style="margin-top:4px;">\${e.id}</div>
                            </td>
                        </tr>
                    \`;
                });

                html += '</tbody></table>';
                document.getElementById('content').innerHTML = html;

            } catch (error) {
                document.getElementById('content').innerHTML = 
                    '<p style="padding:20px;text-align:center;color:#dc2626;">❌ Error: ' + error.message + '</p>';
            }
        }

        // Load on page load
        load();

        // Auto-refresh every 30 seconds
        setInterval(load, 30000);
    </script>
</body>
</html>
    `);
});

// ADMIN API - Get all enquiries
app.get('/api/admin/enquiries', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, first_name, family_surname, parent_email, parent_name,
                age_group, form_data->>'boardingPreference' as boarding,
                form_data->'academicInterests' as interests,
                created_at, status
            FROM inquiries
            WHERE school = 'cheltenham'
            ORDER BY created_at DESC
            LIMIT 100
        `;
        
        const result = await pool.query(query);
        res.json({ success: true, total: result.rows.length, enquiries: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch enquiries' });
    }
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT school, COUNT(*) as count FROM inquiries GROUP BY school
        `);
        res.json({ database: 'connected', schools: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`   Enquiry form: http://localhost:${PORT}/`);
    console.log(`   Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`   Prospectus: http://localhost:${PORT}/prospectus\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Closing database...');
    pool.end(() => process.exit(0));
});

process.on('SIGINT', () => {
    console.log('\nClosing database...');
    pool.end(() => process.exit(0));
});