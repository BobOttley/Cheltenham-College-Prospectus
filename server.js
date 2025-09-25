const express = require('express');
const path = require('path');
const app = express();

// Use environment port or fallback to 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// In-memory storage for enquiries (use database in production)
const enquiries = new Map();

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve the enquiry form as the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'enquiry-form.html'));
});

// Robust transform function (accept anything, output canonical)
function transformFormData(formData) {
    // Defensive maps (accept legacy inputs, output canonical)
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

    // Prefer canonical if already provided; else map legacy to canonical
    const stageIn = formData.stage || formData.childAge || 'Senior';
    const stage = stageMap[norm(stageIn)] || (['Lower', 'Upper', 'Senior'].includes(stageIn) ? stageIn : 'Senior');

    const genderRaw = (formData.gender || formData.childGender || '').toString().trim().toLowerCase();
    const gender = genderRaw.startsWith('f') ? 'female'
                 : genderRaw.startsWith('m') ? 'male'
                 : '';

    const bpIn = formData.boardingPreference || formData.boarding || '';
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

// Handle enquiry form submission
app.post('/api/submit-enquiry', (req, res) => {
    console.log('=== RAW FORM DATA ===');
    console.log(req.body);
    console.log('=====================');
    
    try {
        const enquiryId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const transformedData = transformFormData(req.body);
        
        console.log('=== TRANSFORMED DATA ===');
        console.log(transformedData);
        console.log('========================');
        
        // Store the enquiry
        enquiries.set(enquiryId, {
            id: enquiryId,
            ...transformedData,
            timestamp: new Date().toISOString()
        });
        
        console.log(`New enquiry: ${transformedData.childName} (${transformedData.email})`);
        console.log(`Stage: ${transformedData.stage}, Academic interests: ${transformedData.academicInterests.join(', ')}`);
        
        // Redirect to prospectus with the data
        res.json({
            success: true,
            prospectusURL: `/prospectus?id=${enquiryId}`
        });
        
    } catch (error) {
        console.error('Error processing enquiry:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve prospectus data for a specific enquiry
app.get('/api/enquiry/:id', (req, res) => {
    const enquiry = enquiries.get(req.params.id);
    if (!enquiry) {
        console.log(`Enquiry not found: ${req.params.id}`);
        return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }
    res.json({ success: true, data: enquiry });
});

// Serve prospectus (your existing index.html)
app.get('/prospectus', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Debug endpoint to see all enquiries (only in development)
app.get('/api/debug', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Debug endpoint disabled in production' });
    }
    
    res.json({
        totalEnquiries: enquiries.size,
        enquiries: Array.from(enquiries.values())
    });
});

// 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Enquiry form: /');
    console.log('Prospectus: /prospectus');
    console.log('Health check: /health');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});