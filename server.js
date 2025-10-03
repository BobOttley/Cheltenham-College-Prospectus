require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();

// Use environment port or fallback to 3000
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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

// ENHANCED ADMIN DASHBOARD with Open Days Management
app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Cheltenham College - Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
        
        /* Header */
        .header { background: #1a1a4e; color: white; padding: 30px; }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header p { opacity: 0.8; }
        
        /* Tabs */
        .tabs { background: white; border-bottom: 2px solid #e9ecef; }
        .tabs-container { max-width: 1400px; margin: 0 auto; display: flex; }
        .tab { padding: 15px 30px; cursor: pointer; border-bottom: 3px solid transparent; font-weight: 500; }
        .tab:hover { background: #f8f9fa; }
        .tab.active { border-bottom-color: #c9a961; color: #c9a961; }
        
        /* Content */
        .content { max-width: 1400px; margin: 0 auto; padding: 30px 20px; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        /* Stats */
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 32px; font-weight: bold; color: #c9a961; margin-bottom: 5px; }
        .stat-label { color: #666; font-size: 14px; }
        
        /* Table */
        .table-container { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; color: #1a1a4e; border-bottom: 2px solid #e9ecef; }
        td { padding: 12px; border-bottom: 1px solid #e9ecef; }
        tr:hover { background: #f8f9fa; }
        
        /* Buttons */
        .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-primary { background: #c9a961; color: white; }
        .btn-primary:hover { background: #b8975a; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-sm { padding: 6px 12px; font-size: 14px; }
        
        /* Badge */
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .badge-new { background: #d4edda; color: #155724; }
        .badge-active { background: #d4edda; color: #155724; }
        .badge-inactive { background: #f8d7da; color: #721c24; }
        .badge-boarding { background: #cfe2ff; color: #084298; }
        .badge-day { background: #fff3cd; color: #664d03; }
        
        /* Links */
        .prospectus-link { 
            display: inline-block; background: #1a1a4e; color: white; padding: 6px 12px; 
            border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500;
        }
        .prospectus-link:hover { background: #2a2a5e; }
        
        /* Modal */
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
        .modal.active { display: flex; align-items: center; justify-content: center; }
        .modal-content { background: white; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
        .modal-header { padding: 20px; border-bottom: 1px solid #e9ecef; }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 20px; border-top: 1px solid #e9ecef; display: flex; justify-content: flex-end; gap: 10px; }
        
        /* Form */
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
        .form-control { width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; }
        textarea.form-control { min-height: 100px; resize: vertical; }
        
        /* Open Days Grid */
        .open-days-grid { display: grid; gap: 20px; }
        .open-day-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #c9a961; }
        .open-day-card.inactive { opacity: 0.6; border-left-color: #6c757d; }
        .open-day-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .open-day-title { font-size: 18px; font-weight: bold; color: #1a1a4e; }
        .open-day-date { font-size: 16px; color: #c9a961; margin-bottom: 5px; }
        .open-day-actions { display: flex; gap: 8px; margin-top: 15px; }
        
        /* Filters */
        .filters { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }
        .checkbox-label { display: flex; align-items: center; gap: 5px; }
        
        /* Empty state */
        .empty-state { text-align: center; padding: 60px 20px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Cheltenham College Admin</h1>
        <p>Manage enquiries and open days</p>
    </div>

    <div class="tabs">
        <div class="tabs-container">
            <div class="tab active" onclick="switchTab('enquiries')">Enquiries</div>
            <div class="tab" onclick="switchTab('opendays')">Open Days</div>
        </div>
    </div>

    <div class="content">
        <!-- ENQUIRIES TAB -->
        <div id="enquiries-tab" class="tab-content active">
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
                <button class="btn btn-primary" style="margin-bottom:20px;" onclick="loadEnquiries()">Refresh</button>
                <div id="enquiries-content">Loading...</div>
            </div>
        </div>

        <!-- OPEN DAYS TAB -->
        <div id="opendays-tab" class="tab-content">
            <div class="filters">
                <button class="btn btn-primary" onclick="openAddModal()">Add New Open Day</button>
                <label class="checkbox-label">
                    <input type="checkbox" id="showPastEvents" onchange="loadOpenDays()">
                    <span>Show past events</span>
                </label>
                <button class="btn btn-secondary" onclick="loadOpenDays()">Refresh</button>
            </div>

            <div id="opendays-content">Loading...</div>
        </div>
    </div>

    <!-- OPEN DAY MODAL -->
    <div id="openDayModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Add Open Day</h2>
            </div>
            <form id="openDayForm" onsubmit="saveOpenDay(event)">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Event Name *</label>
                        <input type="text" id="eventName" class="form-control" required placeholder="e.g., Open Morning">
                    </div>
                    <div class="form-group">
                        <label>Event Date *</label>
                        <input type="date" id="eventDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Event Time</label>
                        <input type="text" id="eventTime" class="form-control" placeholder="e.g., 09:00-12:00">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="eventDescription" class="form-control"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Booking URL</label>
                        <input type="url" id="bookingUrl" class="form-control" placeholder="https://...">
                    </div>
                    <input type="hidden" id="eventId">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        let currentOpenDays = [];

        // Tab switching
        function switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tab + '-tab').classList.add('active');
            
            if (tab === 'enquiries') loadEnquiries();
            if (tab === 'opendays') loadOpenDays();
        }

        // ENQUIRIES
        async function loadEnquiries() {
            document.getElementById('enquiries-content').innerHTML = '<p style="padding:20px;">Loading...</p>';
            
            try {
                const res = await fetch('/api/admin/enquiries');
                const data = await res.json();
                
                if (!data.success) throw new Error(data.error);

                const enquiries = data.enquiries;
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

                document.getElementById('totalCount').textContent = enquiries.length;
                document.getElementById('todayCount').textContent = enquiries.filter(e => new Date(e.created_at) >= today).length;
                document.getElementById('weekCount').textContent = enquiries.filter(e => new Date(e.created_at) >= weekAgo).length;

                let html = '<table><thead><tr><th>Date</th><th>Child</th><th>Family</th><th>Email</th><th>Age</th><th>Boarding</th><th>Interests</th><th>Prospectus</th></tr></thead><tbody>';

                enquiries.forEach(e => {
                    const date = new Date(e.created_at).toLocaleDateString('en-GB');
                    const interests = e.interests ? e.interests.slice(0,3).join(', ') : '-';
                    const boardingClass = e.boarding?.includes('Boarding') ? 'boarding' : 'day';
                    
                    html += \`
                        <tr>
                            <td>\${date}</td>
                            <td><strong>\${e.first_name}</strong></td>
                            <td>\${e.family_surname}</td>
                            <td>\${e.parent_email}</td>
                            <td>\${e.age_group}</td>
                            <td><span class="badge badge-\${boardingClass}">\${e.boarding || '-'}</span></td>
                            <td style="font-size:12px;">\${interests}</td>
                            <td><a href="/prospectus?id=\${e.id}" target="_blank" class="prospectus-link">View</a></td>
                        </tr>
                    \`;
                });

                html += '</tbody></table>';
                document.getElementById('enquiries-content').innerHTML = html;

            } catch (error) {
                document.getElementById('enquiries-content').innerHTML = '<p style="padding:20px;color:red;">Error: ' + error.message + '</p>';
            }
        }

        // OPEN DAYS
        async function loadOpenDays() {
            document.getElementById('opendays-content').innerHTML = '<p style="padding:20px;">Loading...</p>';
            const includePast = document.getElementById('showPastEvents').checked;
            
            try {
                const res = await fetch('/api/admin/open-days?include_past=' + includePast);
                const data = await res.json();
                
                if (!data.success) throw new Error(data.error);

                currentOpenDays = data.openDays;
                
                if (currentOpenDays.length === 0) {
                    document.getElementById('opendays-content').innerHTML = '<div class="empty-state"><h3>No open days found</h3><p>Click "Add New Open Day" to create one</p></div>';
                    return;
                }

                const today = new Date().toISOString().split('T')[0];
                
                let html = '<div class="open-days-grid">';
                currentOpenDays.forEach(event => {
                    const isPast = event.event_date < today;
                    const isActive = event.is_active;
                    const status = isPast ? 'past' : (isActive ? 'active' : 'inactive');
                    
                    html += \`
                        <div class="open-day-card \${!isActive ? 'inactive' : ''}">
                            <div class="open-day-header">
                                <div>
                                    <div class="open-day-title">\${event.event_name}</div>
                                    <div class="open-day-date">\${new Date(event.event_date).toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</div>
                                    \${event.event_time ? '<div>🕒 ' + event.event_time + '</div>' : ''}
                                </div>
                                <span class="badge badge-\${status}">\${status}</span>
                            </div>
                            \${event.description ? '<p style="margin:10px 0;color:#666;">' + event.description + '</p>' : ''}
                            \${event.booking_url ? '<a href="' + event.booking_url + '" target="_blank" style="color:#c9a961;">🔗 Booking link</a>' : ''}
                            <div class="open-day-actions">
                                <button class="btn btn-secondary btn-sm" onclick="editOpenDay(\${event.id})">Edit</button>
                                \${isActive ? 
                                    '<button class="btn btn-danger btn-sm" onclick="deleteOpenDay(' + event.id + ')">Delete</button>' : 
                                    '<button class="btn btn-success btn-sm" onclick="reactivateOpenDay(' + event.id + ')">Reactivate</button>'
                                }
                            </div>
                        </div>
                    \`;
                });
                html += '</div>';
                
                document.getElementById('opendays-content').innerHTML = html;

            } catch (error) {
                document.getElementById('opendays-content').innerHTML = '<p style="padding:20px;color:red;">Error: ' + error.message + '</p>';
            }
        }

        function openAddModal() {
            document.getElementById('modalTitle').textContent = 'Add Open Day';
            document.getElementById('openDayForm').reset();
            document.getElementById('eventId').value = '';
            document.getElementById('openDayModal').classList.add('active');
        }

        function editOpenDay(id) {
            const event = currentOpenDays.find(e => e.id === id);
            if (!event) return;

            document.getElementById('modalTitle').textContent = 'Edit Open Day';
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventName').value = event.event_name;
            document.getElementById('eventDate').value = event.event_date;
            document.getElementById('eventTime').value = event.event_time || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('bookingUrl').value = event.booking_url || '';
            document.getElementById('openDayModal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('openDayModal').classList.remove('active');
        }

        async function saveOpenDay(e) {
            e.preventDefault();

            const id = document.getElementById('eventId').value;
            const data = {
                event_name: document.getElementById('eventName').value,
                event_date: document.getElementById('eventDate').value,
                event_time: document.getElementById('eventTime').value,
                description: document.getElementById('eventDescription').value,
                booking_url: document.getElementById('bookingUrl').value
            };

            try {
                const url = id ? '/api/admin/open-days/' + id : '/api/admin/open-days';
                const method = id ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method: method,
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });

                const result = await res.json();
                if (!result.success) throw new Error(result.error);

                closeModal();
                loadOpenDays();
                alert('Open day saved successfully!');
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        async function deleteOpenDay(id) {
            if (!confirm('Delete this open day?')) return;

            try {
                const res = await fetch('/api/admin/open-days/' + id, {method: 'DELETE'});
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                loadOpenDays();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        async function reactivateOpenDay(id) {
            try {
                const res = await fetch('/api/admin/open-days/' + id, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({is_active: true})
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                loadOpenDays();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        // Close modal on outside click
        document.getElementById('openDayModal').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });

        // Initial load
        loadEnquiries();
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

// ===== OPEN DAYS API ROUTES =====

// Get all open days
app.get('/api/admin/open-days', async (req, res) => {
    try {
        const includePast = req.query.include_past === 'true';
        let query = `
            SELECT * FROM open_days 
            WHERE school = 'cheltenham'
        `;
        if (!includePast) {
            query += ` AND event_date >= CURRENT_DATE`;
        }
        query += ` ORDER BY event_date ASC`;
        
        const result = await pool.query(query);
        res.json({ success: true, openDays: result.rows });
    } catch (error) {
        console.error('Error fetching open days:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch open days' });
    }
});

// Create open day
app.post('/api/admin/open-days', async (req, res) => {
    try {
        const { event_name, event_date, event_time, description, booking_url } = req.body;
        
        const query = `
            INSERT INTO open_days (event_name, event_date, event_time, description, booking_url, school)
            VALUES ($1, $2, $3, $4, $5, 'cheltenham')
            RETURNING *
        `;
        
        const result = await pool.query(query, [event_name, event_date, event_time, description, booking_url]);
        res.json({ success: true, openDay: result.rows[0] });
    } catch (error) {
        console.error('Error creating open day:', error);
        res.status(500).json({ success: false, error: 'Failed to create open day' });
    }
});

// Update open day
app.put('/api/admin/open-days/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { event_name, event_date, event_time, description, booking_url, is_active } = req.body;
        
        const query = `
            UPDATE open_days 
            SET event_name = COALESCE($1, event_name),
                event_date = COALESCE($2, event_date),
                event_time = COALESCE($3, event_time),
                description = COALESCE($4, description),
                booking_url = COALESCE($5, booking_url),
                is_active = COALESCE($6, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `;
        
        const result = await pool.query(query, [event_name, event_date, event_time, description, booking_url, is_active, id]);
        res.json({ success: true, openDay: result.rows[0] });
    } catch (error) {
        console.error('Error updating open day:', error);
        res.status(500).json({ success: false, error: 'Failed to update open day' });
    }
});

// Delete open day
app.delete('/api/admin/open-days/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE open_days SET is_active = false WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting open day:', error);
        res.status(500).json({ success: false, error: 'Failed to delete open day' });
    }
});

// Public endpoint for Emily to get upcoming open days
app.get('/api/open-days', async (req, res) => {
    try {
        const query = `
            SELECT event_name, event_date, event_time, description, booking_url
            FROM open_days
            WHERE is_active = TRUE 
            AND event_date >= CURRENT_DATE
            AND school = 'cheltenham'
            ORDER BY event_date ASC
            LIMIT 10
        `;
        
        const result = await pool.query(query);
        const events = result.rows.map(row => ({
            event_name: row.event_name,
            date_iso: row.event_date,
            date_human: new Date(row.event_date).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            }),
            time: row.event_time,
            description: row.description,
            booking_link: row.booking_url
        }));
        
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error fetching open days:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch open days' });
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