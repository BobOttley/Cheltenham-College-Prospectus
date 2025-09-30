/* ====== Personalisation context ====== */
console.log('APP.JS IS LOADING');
const CTX = (() => {
  console.log('=== CTX DEBUG ===');
  console.log('window.PROSPECTUS_CTX:', window.PROSPECTUS_CTX);
  console.log('localStorage enquiry data:', localStorage.getItem('enquiryFormData'));
  
  try {
    const ls = localStorage.getItem('enquiryFormData');
    const lsData = ls ? JSON.parse(ls) : null;
    const data = window.PROSPECTUS_CTX || lsData || {};
    
    // FIX: Build specificSports array from individual fields
    if (data.sport1 || data.sport2 || data.sport3) {
      data.specificSports = [];
      if (data.sport1) data.specificSports.push(data.sport1);
      if (data.sport2) data.specificSports.push(data.sport2);
      if (data.sport3) data.specificSports.push(data.sport3);
    }
    
    console.log('Final CTX with sports:', data);
    return data;
  } catch(e) { 
    console.log('Error:', e);
    return {}; 
  }
})();

// ADD THESE NEW DEBUG LOGS HERE:
console.log('=== FULL CTX DEBUG ===');
console.log('Complete context object:', CTX);
console.log('All CTX keys:', Object.keys(CTX));
console.log('specificSports value:', CTX.specificSports);
console.log('sport1 value:', CTX.sport1);
console.log('sport2 value:', CTX.sport2); 
console.log('sport3 value:', CTX.sport3);
console.log('activities:', CTX.activities);
console.log('===================');
/* ====== Utilities ====== */
const $  = (sel,ctx=document)=>ctx.querySelector(sel);
const $$ = (sel,ctx=document)=>Array.from(ctx.querySelectorAll(sel));

function matchesCondition(ctx, ruleValue, actual){
  const rv = Array.isArray(ruleValue) ? ruleValue : [ruleValue];
  const av = Array.isArray(actual) ? actual : [actual];
  return rv.some(v => av.includes(v));
}
function visibleByRules(el, ctx){
  const json = el.getAttribute('data-visible-when');
  if(!json) return true;
  try {
    const rules = JSON.parse(json);
    return Object.entries(rules).every(([k,v]) => matchesCondition(ctx, v, ctx[k]));
  } catch(e){ return true; }
}

/* Swap lazy sources for images/videos */
function hydrateLazyAssets(root){
  $$('img[data-src]', root).forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
  $$('video[data-src]', root).forEach(v => {
    const src = v.dataset.src;
    if(src){ const s=document.createElement('source'); s.src=src; s.type='video/mp4'; v.appendChild(s); v.removeAttribute('data-src'); }
    if(v.dataset.poster){ v.poster = v.dataset.poster; v.removeAttribute('data-poster'); }
  });
}

/* ====== Module registry ====== */
const MODULES = Object.create(null);

/* Hero module initialiser (FULL) */
MODULES['hero'] = (root, ctx) => {
  // Personal text
  $$('.child-name', root).forEach(el => el.textContent = ctx.childName);
  $$('.parent-name', root).forEach(el => el.textContent = ctx.parentName);
  $$('.family-name', root).forEach(el => el.textContent = ctx.familyName);

  // Lazy assets inside this module
  hydrateLazyAssets(root);

  // Notes (academic, sport, pastoral)
  const setAcademicNote = () => {
    const el = $('.academic-interest-note', root);
    if(!el) return;
    const ai = ctx.academicInterests || [];
    let note = '';
    if (ai.includes('sciences')){
      note = `I understand ${ctx.childName}'s interest in the Sciences — our laboratories are equipped to university standard and our Science department has an exceptional track record, with many pupils going on to read Medicine, Engineering and Natural Sciences at top universities.`;
    } else if (ai.includes('mathematics')){
      note = `For a pupil with ${ctx.childName}'s mathematical interests, our setting from day one and extension opportunities including UKMT challenges provide the perfect environment to excel.`;
    } else if (ai.includes('languages')){
      note = `${ctx.childName}'s interest in languages will flourish here with our offering of French, Spanish, German and Mandarin, plus regular exchanges and immersion trips.`;
    } else if (ai.includes('humanities')){
      note = `Our Humanities departments would be perfect for ${ctx.childName} — from the Morley History Society to Geography field trips, we bring these subjects to life.`;
    } else if (ai.includes('arts')){
      note = `${ctx.childName}'s creative interests align perfectly with our exceptional Art department and dedicated studio spaces.`;
    }
    el.textContent = note;
  };
  const setSportNote = () => {
    const el = $('.sport-interest-note', root);
    if(!el) return;
    const acts = ctx.activities || [];
    el.textContent = acts.includes('sports')
      ? `I see ${ctx.childName} is interested in sport — with over 30 sports on offer and coaching from professionals including Olympians and internationals, every pupil finds their passion.`
      : '';
  };
  const setPastoralNote = () => {
    const el = $('.pastoral-priority-note', root);
    if(!el) return;
    if (ctx?.priorities?.pastoral === 3){
      el.textContent = `I'm particularly pleased you value pastoral care so highly — with our Floreat wellbeing programme, dedicated House staff living on-site, and a 1:8 tutor ratio, ${ctx.childName}'s wellbeing will always be our priority.`;
    } else if (ctx.boardingPreference && ctx.boardingPreference.includes('Boarding')){
      el.textContent = `As a boarding family, you'll be reassured to know our House staff live on-site with their families, creating a true home from home.`;
    } else {
      el.textContent = '';
    }
  };
  setAcademicNote(); setSportNote(); setPastoralNote();

  // UI wiring: audio + scroll hint + overlay shift
  const video = $('.hero-video', root);
  const btn = $('#audioToggle', root);
  const icon = $('#audioIcon', root);
  const overlay = $('#heroOverlay', root);
  const scrollInd = $('#scrollIndicator', root);
  let isMuted = true;

  function setIcon(){ 
  if(icon) icon.textContent = isMuted ? 'Click to unmute' : 'Click to mute'; 
  }

  if(video){ video.muted = isMuted; }
  if(btn){
   btn.addEventListener('click', () => {
      isMuted = !isMuted;
      if(video) video.muted = isMuted;
     setIcon();
    });
  }
  setIcon();

  if(scrollInd){
    setTimeout(()=> scrollInd.classList.add('show'), 13000);
    scrollInd.addEventListener('click', () => window.scrollTo({top: window.innerHeight, behavior:'smooth'}));
  }
  if(overlay){
    setTimeout(()=> overlay.classList.add('move-bottom'), 12000);
  }

  // Auto-mute on scroll
  function handleScroll(){
    if (window.scrollY > 50 && video && !video.muted){
      isMuted = true; video.muted = true; setIcon();
    }
  }
  window.addEventListener('scroll', handleScroll, {passive:true});
};
/* Key Statistics module */
MODULES['key_statistics'] = (sectionEl, ctx) => {
  const name = (ctx.childName || '').trim();
  const hasName = name && !name.startsWith('[');

  const titleEl = sectionEl.querySelector('.section-title');
  const subEl   = sectionEl.querySelector('.section-subtitle');

  // Header: “By the Numbers for {Name}”
  if (titleEl && hasName){
    titleEl.innerHTML = `By the <span class="highlight">Numbers</span> for ${name}`;
  }

  // Subtitle: “…and the success of {Name}”
  if (subEl && hasName){
    subEl.textContent = `Excellence measured in achievements, opportunities, and the success of ${name}.`;
  }
};

/* ===== HOUSE SYSTEM MODULE - UPDATED FOR MP4 VIDEOS ===== */
/* REPLACE the existing MODULES['house_system'] function in app.js with this code */

MODULES['house_system'] = (root, ctx) => {
  // Name personalization
  root.querySelectorAll('.child-name').forEach(el => {
    const fallback = el.getAttribute('data-fallback') || 'Your child';
    const name = (ctx.childName || '').trim();
    el.textContent = name && !name.startsWith('[') ? name : fallback;
  });

  // Pastoral emphasis note
  const note = root.querySelector('.house-personality-note');
  if (note) {
    if (ctx?.priorities?.pastoral === 3) {
      note.textContent = `I'm pleased you value pastoral care so highly - ${ctx.childName || 'your child'}'s wellbeing will always be our priority.`;
    } else {
      note.style.display = 'none';
    }
  }

  // Simple gender and boarding detection to match enquiry form
  const getGender = () => {
    const raw = (ctx.gender || '').toString().toLowerCase().trim();
    if (raw === 'female') return 'female';
    if (raw === 'male') return 'male';
    return '';
  };

  const getBoarding = () => {
    const raw = (ctx.boardingPreference || '').toString().toLowerCase().trim();
    if (raw.includes('day')) return 'day';
    if (raw.includes('boarding')) return 'boarding';
    return '';
  };

  const gender = getGender();
  const pref = getBoarding();

  console.log('House filtering - Gender:', gender, 'Boarding:', pref);

  // Filter houses by gender and boarding preference
  root.querySelectorAll('.house-card').forEach(card => {
    const cardGender = (card.dataset.gender || '').toLowerCase();
    const cardType = (card.dataset.type || '').toLowerCase();
    
    let show = true;
    
    if (gender && cardGender && gender !== cardGender) {
      show = false;
    }
    
    if (pref === 'day' && cardType === 'boarding') {
      show = false;
    } else if (pref === 'boarding' && cardType === 'day') {
      show = false;
    }
    
    card.style.display = show ? 'block' : 'none';
  });

  // Lazy load images
  if (typeof hydrateLazyAssets === 'function') {
    hydrateLazyAssets(root);
  }

  // ===== NEW VIDEO MANAGEMENT FOR MP4 FILES - OPTIMIZED FOR MOBILE =====
  
  // Utility: Prime video for mobile autoplay (critical for iOS/Safari)
  const primeVideo = (video) => {
    if (!video) return;
    video.muted = true;
    video.playsInline = true;            // JS property
    video.setAttribute('playsinline', ''); // iOS attribute  
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('preload', 'metadata'); // Only load metadata until play
  };

  // LAZY LOAD: Set video source from data-src (only called on expand)
  const loadVideoSource = (video) => {
    if (!video) return;
    
    const dataSrc = video.getAttribute('data-src');
    if (!dataSrc || video.src) return;
    
    video.src = dataSrc;
    video.load();
    console.log('Lazy loaded video:', dataSrc);
  };

  // Play video when card expands
  const playVideo = (video) => {
    if (!video) return;
    
    primeVideo(video);        // Prime for mobile
    loadVideoSource(video);   // Lazy load source
    
    // Small delay to ensure source is loaded
    setTimeout(() => {
      video.play().catch(err => {
        console.log('House video autoplay blocked:', err);
      });
    }, 100);
  };

  // Stop video when card collapses
  const stopVideo = (video) => {
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    video.muted = true;
  };

  // Expand/collapse functionality with EVENT DELEGATION
  root.addEventListener('click', (e) => {
    // Handle expand buttons
    if (e.target.classList.contains('expand-button')) {
      e.preventDefault();
      e.stopPropagation();
      
      const card = e.target.closest('.house-card');
      if (!card) return;
      
      const details = card.querySelector('.house-details');
      if (!details) return;
      
      const isExpanded = card.classList.contains('expanded');
      
      // Close all other expanded cards
      root.querySelectorAll('.house-card.expanded').forEach(otherCard => {
        if (otherCard !== card) {
          otherCard.classList.remove('expanded');
          const otherDetails = otherCard.querySelector('.house-details');
          const otherVideo = otherCard.querySelector('.house-video');
          if (otherDetails) {
            otherDetails.style.display = 'none';
            otherDetails.setAttribute('hidden', '');
          }
          if (otherVideo) stopVideo(otherVideo);
        }
      });

      if (!isExpanded) {
        // Expand this card
        card.classList.add('expanded');
        details.style.display = 'block';
        details.removeAttribute('hidden');
        
        const video = card.querySelector('.house-video');
        if (video) playVideo(video);
        
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      } else {
        // Collapse this card
        card.classList.remove('expanded');
        details.style.display = 'none';
        details.setAttribute('hidden', '');
        
        const video = card.querySelector('.house-video');
        if (video) stopVideo(video);
      }
      return;
    }

    // Handle mute buttons - TOGGLE audio on/off
    if (e.target.classList.contains('mute-button')) {
      e.preventDefault();
      e.stopPropagation();
      
      const card = e.target.closest('.house-card');
      const video = card?.querySelector('.house-video');
      if (!video) return;
      
      // Ensure video source is loaded
      loadVideoSource(video);
      
      // Toggle mute state
      if (video.muted) {
        // Unmute
        video.muted = false;
        video.volume = 1.0;
        e.target.innerHTML = '🔇 Click to Mute';
        console.log('House video unmuted');
        
        // If paused, play it
        if (video.paused) {
          video.play().catch(err => {
            console.error('Could not play video:', err);
          });
        }
      } else {
        // Mute
        video.muted = true;
        e.target.innerHTML = '🔊 Click for Sound';
        console.log('House video muted');
      }
      return;
    }

    // Handle close buttons
    if (e.target.classList.contains('close-button')) {
      e.preventDefault();
      e.stopPropagation();
      
      const card = e.target.closest('.house-card');
      if (!card) return;
      
      card.classList.remove('expanded');
      const details = card.querySelector('.house-details');
      if (details) {
        details.style.display = 'none';
        details.setAttribute('hidden', '');
        const video = card.querySelector('.house-video');
        if (video) stopVideo(video);
      }
      return;
    }
  });

  // Auto-mute videos when scrolling away
  const setupAutoMute = () => {
    const checkVideoVisibility = () => {
      const expandedCards = root.querySelectorAll('.house-card.expanded');
      
      expandedCards.forEach(card => {
        const video = card.querySelector('.house-video');
        if (!video || !video.src) return;
        
        const rect = video.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        // If video is out of view and not muted, mute it
        if (!isVisible && !video.muted) {
          video.muted = true;
          const btn = card.querySelector('.mute-button');
          if (btn) btn.innerHTML = '🔊 Click for Sound';
          console.log('House video auto-muted - scrolled out of view');
        }
      });
    };

    // Throttled scroll handler
    let scrollTimeout;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        checkVideoVisibility();
        scrollTimeout = null;
      }, 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  setupAutoMute();
};
/* Pastoral Care module initializer - Add to MODULES object in app.js */
MODULES['pastoral_care'] = (root, ctx) => {
  // Update all name placeholders
  const updateNamePlaceholders = () => {
    root.querySelectorAll('.child-name').forEach(el => {
      const fallback = el.getAttribute('data-fallback') || 'your child';
      const name = (ctx.childName || '').trim();
      el.textContent = name && !name.startsWith('[') ? name : fallback;
    });
  };

  // Add priority-based content
  const addPriorityContent = () => {
    const priorityTitle = root.querySelector('.priority-title');
    const priorityMessage = root.querySelector('.priority-message');
    
    if (!priorityTitle || !priorityMessage) return;
    
    const childName = ctx.childName || 'Your child';
    const familyName = ctx.familyName || 'your family';
    
    if (ctx.priorities?.pastoral === 3) {
      priorityTitle.textContent = `${childName}'s Wellbeing is Our Priority`;
      priorityMessage.textContent = `I'm pleased you value pastoral care so highly. Our comprehensive support system ensures ${childName}'s wellbeing is at the heart of everything we do.`;
    } else if (ctx.boardingPreference === 'Full Boarding') {
      priorityTitle.textContent = `Boarding Family Support for ${childName}`;
      priorityMessage.textContent = `As a boarding family, you'll be reassured to know our Housemasters and Housemistresses live on-site with their own families.`;
    } else {
      priorityTitle.textContent = `Comprehensive Pastoral Support for ${childName}`;
      priorityMessage.textContent = `Every pupil's wellbeing journey is unique. Our multi-layered pastoral care system ensures ${childName} receives exactly the right support.`;
    }
  };

  // Add conditional content
  const addConditionalContent = () => {
    const childName = ctx.childName || 'your child';
    
    // Boarding notes
    const boardingNote = root.querySelector('.boarding-note');
    if (boardingNote && ctx.boardingPreference === 'Full Boarding') {
      boardingNote.textContent = `As a full boarding pupil, ${childName} will experience the richness of our residential community life.`;
    }
    
    // Academic notes
    const academicNote = root.querySelector('.academic-support-note');
    if (academicNote && ctx.academicInterests?.includes('sciences')) {
      academicNote.textContent = `With ${childName}'s Sciences interests, your Tutor will provide specialist academic guidance.`;
    }
    
    // Wellbeing notes
    const wellbeingNote = root.querySelector('.wellbeing-note');
    if (wellbeingNote && ctx.values?.includes('wellbeing')) {
      wellbeingNote.textContent = `Given your family's focus on wellbeing, you'll appreciate our Floreat programme's emphasis on mental health.`;
    }
    
    // Health notes
    const healthNote = root.querySelector('.health-note');
    if (healthNote && ctx.activities?.includes('sports')) {
      healthNote.textContent = `With ${childName}'s sporting interests, our Health Centre provides specialist sports injury support.`;
    }
    
    // Leadership notes
    const leadershipNote = root.querySelector('.leadership-note');
    if (leadershipNote && ctx.activities?.includes('leadership')) {
      leadershipNote.textContent = `${childName}'s leadership interests align perfectly with our peer mentoring programme.`;
    }
    
    // Learning support notes
    const learningNote = root.querySelector('.learning-support-note');
    if (learningNote && ctx.priorities?.academic === 3) {
      learningNote.textContent = `Given your high academic priorities, our Learning Support team will ensure ${childName} has every opportunity to excel.`;
    }
  };

  // Prioritize support pillars
  const prioritizeSupportPillars = () => {
    const pillars = root.querySelectorAll('.pillar-card');
    
    pillars.forEach(pillar => {
      const category = pillar.getAttribute('data-category');
      let priority = 'medium-priority';
      
      if ((category === 'house' && ctx.boardingPreference === 'Full Boarding') ||
          (category === 'floreat' && ctx.priorities?.pastoral === 3) ||
          (category === 'tutor' && ctx.priorities?.academic === 3)) {
        priority = 'high-priority';
      }
      
      pillar.classList.add(priority);
    });
  };

  // Add final commitment
  const addFinalCommitment = () => {
    const finalCommitment = root.querySelector('.final-commitment');
    if (!finalCommitment) return;
    
    const childName = ctx.childName || 'your child';
    let message = `Cheltenham College's comprehensive pastoral care system ensures ${childName} receives individual attention, support, and guidance to flourish academically, socially, and personally.`;
    
    if (ctx.priorities?.pastoral === 3 && ctx.boardingPreference === 'Full Boarding') {
      message += ` With dedicated House staff living on-site and our innovative Floreat programme, we create a nurturing environment where wellbeing is paramount.`;
    }
    
    finalCommitment.textContent = message;
  };

  // Setup journey timeline
  const setupJourneyTimeline = () => {
    const steps = root.querySelectorAll('.journey-step');
    const details = root.querySelector('#journey-details');
    const text = root.querySelector('#journey-text');
    
    if (!steps.length || !details || !text) return;
    
    const childName = ctx.childName || 'your child';
    const stepDetails = [
      `During ${childName}'s first weeks, their Housemaster/Housemistress and Tutor will work closely together to ensure a smooth transition.`,
      `${childName} will participate in House activities, be paired with older mentors, and develop trust with their Tutor through regular check-ins.`,
      `Through the Floreat programme, ${childName} will develop resilience, learn stress management techniques, and take on leadership roles.`,
      `As ${childName} progresses, they'll become a mentor to younger pupils and be fully prepared for Upper College and beyond.`
    ];
    
    steps.forEach((step, index) => {
      step.addEventListener('click', () => {
        steps.forEach(s => s.classList.remove('active'));
        step.classList.add('active');
        text.textContent = stepDetails[index];
        details.style.display = 'block';
      });
    });
  };

  // Setup expandable cards
  const setupExpandables = () => {
    const expandables = root.querySelectorAll('.pillar-card.expandable');
    
    expandables.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.expandable-content')) return;
        
        card.classList.toggle('expanded');
        const content = card.querySelector('.expandable-content');
        if (content) {
          content.classList.toggle('open');
        }
      });
    });
  };

  // Initialize module
  updateNamePlaceholders();
  addPriorityContent();
  addConditionalContent();
  prioritizeSupportPillars();
  addFinalCommitment();
  setupJourneyTimeline();
  setupExpandables();
  
  // Lazy load any images
  if (typeof hydrateLazyAssets === 'function') {
    hydrateLazyAssets(root);
  }
};

/* Student Gallery module initializer - Add to MODULES object in app.js */
MODULES['student_gallery'] = (root, ctx) => {
  // Update name placeholders
  const updateNames = () => {
    root.querySelectorAll('.child-name').forEach(el => {
      const fallback = el.getAttribute('data-fallback') || 'your child';
      const name = (ctx.childName || '').trim();
      el.textContent = name && !name.startsWith('[') ? name : fallback;
    });
  };

  // Add conditional content
  const addConditionalContent = () => {
    const childName = ctx.childName || 'your child';
    
    // Personal journey note
    const journeyNote = root.querySelector('.personal-journey-note');
    if (journeyNote) {
      if (ctx.boardingPreference === 'Full Boarding') {
        journeyNote.textContent = `As a boarding student, you'll experience the full richness of our community life.`;
      } else if (ctx.boardingPreference === 'Day') {
        journeyNote.textContent = `As a day student, you'll enjoy the best of both worlds - our vibrant school community and your home life.`;
      }
    }
    
    // Community note
    const communityNote = root.querySelector('.community-note');
    if (communityNote) {
      if (ctx.values?.includes('wellbeing')) {
        communityNote.textContent = `- with wellbeing at the heart of everything we do.`;
      } else if (ctx.boardingPreference === 'Full Boarding') {
        communityNote.textContent = `- perfect for students seeking a truly immersive educational experience.`;
      } else if (ctx.priorities?.academic === 3) {
        communityNote.textContent = `- where academic excellence drives everything we do.`;
      }
    }
    
    // Academic support note
    const academicNote = root.querySelector('.academic-support-note');
    if (academicNote && ctx.academicInterests?.length > 0) {
      let note = '';
      if (ctx.academicInterests.includes('sciences')) {
        note = ctx.universityAspirations === 'Oxford or Cambridge' 
          ? `With your Sciences interests and Oxbridge ambitions, our university-standard laboratories will support your goals.`
          : `With your interest in Sciences, you'll love our specialized research resources.`;
      } else if (ctx.academicInterests.includes('mathematics')) {
        note = `For mathematical interests like yours, our academic support team provides extension opportunities.`;
      } else if (ctx.academicInterests.includes('humanities')) {
        note = `Our Humanities departments will perfectly support your interests.`;
      }
      academicNote.textContent = note;
    }
    
    // Sports interest note
    const sportNote = root.querySelector('.sport-interest-note');
    if (sportNote && ctx.activities?.includes('sports')) {
      let note = '';
      if (ctx.specificSports?.includes('hockey')) {
        note = `As someone interested in hockey, you'll love our astroturf pitches and excellent reputation.`;
      } else if (ctx.specificSports?.includes('athletics')) {
        note = `With your athletics interests, our track and field facilities will help you excel.`;
      } else if (ctx.specificSports?.includes('rugby')) {
        note = `Our rugby programme has produced internationals - perfect for developing your skills.`;
      } else {
        note = `With your sporting interests, you'll thrive with our professional coaching.`;
      }
      sportNote.textContent = note;
    }
    
    // Pastoral priority note
    const pastoralNote = root.querySelector('.pastoral-priority-note');
    if (pastoralNote) {
      if (ctx.priorities?.pastoral === 3) {
        pastoralNote.textContent = `Since pastoral care is important to you, you'll appreciate our exceptional House staff.`;
      } else if (ctx.boardingPreference === 'Full Boarding') {
        pastoralNote.textContent = `As a boarding family, our House staff live on-site creating a true home environment.`;
      }
    }
    
    // Testimonial connection
    const testimonialConnection = root.querySelector('.testimonial-connection');
    if (testimonialConnection) {
      if (ctx.activities?.includes('leadership')) {
        testimonialConnection.textContent = `This student's experience with leadership opportunities aligns with your interests.`;
      } else if (ctx.boardingPreference === 'Full Boarding') {
        testimonialConnection.textContent = `This perfectly captures the boarding experience you're considering.`;
      }
    }
  };

  // Filter items by gender
  const filterByGender = () => {
    const gender = (ctx.gender || ctx.childGender || '').toLowerCase();
    if (!gender) return;
    
    root.querySelectorAll('.gallery-item[data-gender]').forEach(item => {
      const itemGender = item.getAttribute('data-gender');
      if (itemGender && itemGender !== gender) {
        item.style.display = 'none';
      }
    });
  };

  // Smart category ordering based on priorities
  const smartCategoryOrdering = () => {
    const tabsContainer = root.querySelector('.category-tabs');
    if (!tabsContainer) return;
    
    const tabs = Array.from(root.querySelectorAll('.category-tab'));
    const allTab = tabs.find(t => t.getAttribute('data-category') === 'all');
    const otherTabs = tabs.filter(t => t.getAttribute('data-category') !== 'all');
    
    // Priority mapping
    const categoryPriority = {
      'academic': ctx.priorities?.academic || 2,
      'sport': ctx.priorities?.sports || 2,
      'arts': ctx.priorities?.arts || 2,
      'community': ctx.priorities?.pastoral || 2
    };
    
    // Sort tabs by priority
    otherTabs.sort((a, b) => {
      const aPriority = categoryPriority[a.getAttribute('data-category')] || 2;
      const bPriority = categoryPriority[b.getAttribute('data-category')] || 2;
      return bPriority - aPriority;
    });
    
    // Rebuild tabs container
    tabsContainer.innerHTML = '';
    if (allTab) tabsContainer.appendChild(allTab);
    otherTabs.forEach(tab => {
      const priority = categoryPriority[tab.getAttribute('data-category')];
      if (priority === 3) tab.classList.add('high-priority');
      tabsContainer.appendChild(tab);
    });
  };

  // Reorder gallery items based on priorities
  const reorderGalleryItems = () => {
    const grid = root.querySelector('.gallery-grid');
    if (!grid) return;
    
    const items = Array.from(root.querySelectorAll('.gallery-item'));
    
    // Calculate priority scores
    items.forEach(item => {
      let score = 0;
      const category = item.getAttribute('data-category');
      
      // Category priority scores
      if (category === 'academic' && ctx.priorities?.academic === 3) score += 4;
      if (category === 'sport' && ctx.priorities?.sports === 3) score += 4;
      if (category === 'arts' && ctx.priorities?.arts === 3) score += 4;
      if (category === 'community' && ctx.priorities?.pastoral === 3) score += 4;
      
      // Activity boosts
      if (ctx.activities?.includes('sports') && category === 'sport') score += 3;
      if (ctx.activities?.includes('music') && category === 'arts') score += 3;
      if (ctx.activities?.includes('drama') && category === 'arts') score += 3;
      if (ctx.activities?.includes('leadership') && category === 'community') score += 3;
      
      // Boarding boosts
      if (ctx.boardingPreference === 'Full Boarding' && category === 'community') score += 2;
      
      item.dataset.priority = score;
    });
    
    // Sort and re-append
    items.sort((a, b) => (b.dataset.priority || 0) - (a.dataset.priority || 0));
    grid.innerHTML = '';
    items.forEach(item => grid.appendChild(item));
  };

  // Initialize category filtering
  const initializeFilters = () => {
    const tabs = root.querySelectorAll('.category-tab');
    const items = root.querySelectorAll('.gallery-item');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active state
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Filter items
        const category = tab.getAttribute('data-category');
        
        items.forEach(item => {
          const itemCategory = item.getAttribute('data-category');
          
          if (category === 'all' || itemCategory === category) {
            item.classList.remove('hidden');
            item.style.display = '';
          } else {
            item.classList.add('hidden');
            setTimeout(() => {
              if (item.classList.contains('hidden')) {
                item.style.display = 'none';
              }
            }, 500);
          }
        });
      });
    });
  };

  // Initialize module
  updateNames();
  addConditionalContent();
  filterByGender();
  smartCategoryOrdering();
  reorderGalleryItems();
  initializeFilters();
  
  // Lazy load images
  if (typeof hydrateLazyAssets === 'function') {
    hydrateLazyAssets(root);
  }
};

/* ====== SPORTS MODULE WITH MP4 VIDEO SUPPORT ONLY - NO IFRAMES ====== */

/* ====== SPORTS MODULE WITH MP4 VIDEO SUPPORT ONLY - NO IFRAMES ====== */
MODULES['sports'] = (root, ctx) => {
  console.log('=== SPORTS MODULE INIT DEBUG ===');
  console.log('Full context received:', ctx);
  console.log('Specific sports:', ctx.specificSports);
  console.log('Child name:', ctx.childName);
  console.log('================================');

  // Update name placeholders
  root.querySelectorAll('.child-name').forEach(el => {
    const name = (ctx.childName || '').trim();
    el.textContent = name && !name.startsWith('[') ? name : 'Child';
  });

  // Determine gender - default to female for Emma
  const getGender = () => {
    const raw = (ctx.gender || ctx.childGender || '').toLowerCase();
    if (!raw || raw === '') return 'female';
    if (raw.startsWith('f') || raw.includes('girl')) return 'female';
    if (raw.startsWith('m') || raw.includes('boy')) return 'male';
    return 'female'; // Default to female
  };
  const gender = getGender();

  // Setup gender-specific tab and content
  const setupGenderContent = () => {
    const genderTab = root.querySelector('.gender-sport-tab');
    const genderSection = root.querySelector('#gender-specific-section');
    if (!genderTab || !genderSection) return;

    if (gender === 'male') {
      genderTab.textContent = 'RUGBY';
      genderTab.style.display = 'inline-block';

      const title = root.querySelector('.gender-sport-title');
      const heroTitle = root.querySelector('.gender-sport-hero-title');
      const subtitle = root.querySelector('.gender-sport-subtitle');
      if (title) title.textContent = 'RUGBY AT CHELTENHAM';
      if (heroTitle) heroTitle.textContent = 'Strength, Strategy, Success';
      if (subtitle) subtitle.textContent = 'Elite Rugby Programme with International Recognition';

      const stat1 = root.querySelector('.gender-stat-1');
      const label1 = root.querySelector('.gender-label-1');
      const stat2 = root.querySelector('.gender-stat-2');
      const label2 = root.querySelector('.gender-label-2');
      const stat3 = root.querySelector('.gender-stat-3');
      const label3 = root.querySelector('.gender-label-3');

      if (stat1) stat1.textContent = '15+';
      if (label1) label1.textContent = 'Teams';
      if (stat2) stat2.textContent = '12';
      if (label2) label2.textContent = 'Pitches';
      if (stat3) stat3.textContent = '2';
      if (label3) label3.textContent = 'Annual Tours';

    } else {
      genderTab.textContent = 'NETBALL';
      genderTab.style.display = 'inline-block';

      const title = root.querySelector('.gender-sport-title');
      const heroTitle = root.querySelector('.gender-sport-hero-title');
      const subtitle = root.querySelector('.gender-sport-subtitle');
      if (title) title.textContent = 'NETBALL AT CHELTENHAM';
      if (heroTitle) heroTitle.textContent = 'Precision, Power, Performance';
      if (subtitle) subtitle.textContent = 'Elite Netball Programme with National Recognition';

      const stat1 = root.querySelector('.gender-stat-1');
      const label1 = root.querySelector('.gender-label-1');
      const stat2 = root.querySelector('.gender-stat-2');
      const label2 = root.querySelector('.gender-label-2');
      const stat3 = root.querySelector('.gender-stat-3');

      if (stat1) stat1.textContent = '12';
      if (label1) label1.textContent = 'Teams';
      if (stat2) stat2.textContent = '6';
      if (label2) label2.textContent = 'Courts';

      // Hide the third stat for netball
      const thirdStatItem = stat3?.closest('.stat-item');
      if (thirdStatItem) thirdStatItem.style.display = 'none';
    }
  };

  // ===== Video management for HTML5 MP4 videos only =====
  let currentVideo = null;

  // Helper: set autoplay-safe attributes
  const primeVideo = (video) => {
    if (!video) return;
    video.muted = true;                  // required for autoplay
    video.playsInline = true;            // JS property
    video.setAttribute('playsinline', ''); // iOS attribute
    if (!video.hasAttribute('loop')) video.setAttribute('loop', '');
    if (!video.hasAttribute('autoplay')) video.setAttribute('autoplay', '');
    if (!video.hasAttribute('preload')) video.setAttribute('preload', 'metadata');
  };

  // IMPORTANT FIX: do NOT remove src (breaks replay on Safari/iOS)
  const stopVideo = (video) => {
    if (!video) return;
    try {
      video.pause();
      video.currentTime = 0;
      // keep src intact; no video.load() here
    } catch (e) {
      console.error('stopVideo error:', e);
    }
  };

  // For data-driven sources, set src once from data-* attributes
  const ensureSrcFromData = (video) => {
    if (!video) return;
    if (video.classList.contains('gender-video')) {
      const ds = gender === 'male'
        ? video.getAttribute('data-rugby-src')
        : video.getAttribute('data-netball-src');
      if (ds && video.src !== ds) video.src = ds;
    } else {
      const ds = video.getAttribute('data-src');
      if (ds && video.src !== ds) {
        video.src = ds;
        video.removeAttribute('data-src');
      }
    }
  };

  const loadVideo = (video) => {
    if (!video) {
      console.error('No video element provided to loadVideo');
      return;
    }

    console.log('Loading MP4 video:', video.className);

    if (currentVideo && currentVideo !== video) {
      stopVideo(currentVideo);
    }

    primeVideo(video);
    ensureSrcFromData(video);

    // Debug listeners (safe to add once)
    if (!video._dbgBound) {
      video.addEventListener('loadstart', () => console.log('Video load started'));
      video.addEventListener('loadedmetadata', () => console.log('Video metadata loaded'));
      video.addEventListener('canplay', () => console.log('Video can play'));
      video.addEventListener('error', (e) => console.error('Video error:', e));
      video._dbgBound = true;
    }

    video.play().then(() => {
      console.log('Video playing successfully');
    }).catch(e => {
      console.log('Autoplay deferred until interaction:', e?.name || e);
    });

    currentVideo = video;
  };
  
  // --- Tile collapse helpers (phones) - FIXED TO NOT HIDE TOP SPORTS CARDS ---
  const phone = window.matchMedia('(max-width: 768px)');
  const tileSections = () => ([
    // REMOVED the top sports section from here so it won't be collapsed
    root.querySelector('.all-sports-content')?.closest('.all-sports-section'),
    root.querySelector('.facilities-grid')
  ].filter(Boolean));

  const collapseTiles = () => {
    if (!phone.matches) return; // only on phones
    tileSections().forEach(el => {
      if (el) el.classList.add('is-collapsed');
    });
  };

  const expandTiles = () => {
    tileSections().forEach(el => {
      if (el) el.classList.remove('is-collapsed');
    });
  };

  const ensureToggleButton = () => {
    if (!phone.matches) return;
    let toggle = root.querySelector('.tile-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'tile-toggle';
      toggle.type = 'button';
      toggle.textContent = 'Show more sports';
      // place after the student sports section (which contains top sports cards)
      const anchor = root.querySelector('.student-sports-section') || 
                     root.querySelector('.personal-sports-message') || 
                     root.querySelector('.sport-hero');
      anchor?.after(toggle);
      toggle.addEventListener('click', () => {
        const collapsed = tileSections().every(el => el && el.classList.contains('is-collapsed'));
        if (collapsed) { 
          expandTiles(); 
          toggle.textContent = 'Hide sports details'; 
        } else { 
          collapseTiles(); 
          toggle.textContent = 'Show more sports'; 
        }
      });
    }
  };

  // Setup tab switching with proper video handling
  const setupTabs = () => {
    const tabs = root.querySelectorAll('.sport-tab');
    const sections = root.querySelectorAll('.sport-section');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();

        const targetSport = tab.getAttribute('data-sport');
        console.log('Tab clicked:', targetSport);

        // Stop current video
        if (currentVideo) {
          stopVideo(currentVideo);
          currentVideo = null;
        }

        // Update active states
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show/hide sections
        sections.forEach(section => section.classList.remove('active'));

        if (targetSport === 'overview') {
          const overviewSection = root.querySelector('#overview-section');
          if (overviewSection) {
            overviewSection.classList.add('active');
            const overviewVideo = overviewSection.querySelector('video.hero-video');
            if (overviewVideo) loadVideo(overviewVideo);
          }
        } else if (targetSport === 'gender-specific') {
          const genderSection = root.querySelector('#gender-specific-section');
          if (genderSection) {
            genderSection.classList.add('active');
            const genderVideo = genderSection.querySelector('video.gender-video');
            if (genderVideo) loadVideo(genderVideo);
          }
        }

        // Show unmute button for new video
        const activeSection = root.querySelector('.sport-section.active');
        const unmuteBtn = activeSection?.querySelector('.unmute-btn, .sports-unmute-btn');
        if (unmuteBtn) unmuteBtn.style.display = 'block';
      });
    });
  };

  // LAZY VIDEO LOADING - Start active section video only when module scrolls into view
  const setupVideoLazyLoading = () => {
    const activeSection = root.querySelector('.sport-section.active');
    if (!activeSection) return;

    const heroSection = activeSection.querySelector('.sport-hero');
    if (!heroSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('Sports module hero entered viewport - starting active video');

          const video = activeSection.querySelector('video.hero-video') ||
                        activeSection.querySelector('video.gender-video');

          if (video) {
            console.log('Found video to load:', video.className);
            loadVideo(video);   // use your existing loadVideo() to play it
          } else {
            console.error('No video element found in active section!');
          }

          // Unobserve so it only fires once
          observer.unobserve(heroSection);
        }
      });
    }, {
      threshold: 0.4,              // trigger when 40% of hero is visible
      rootMargin: '0px 0px -10% 0px'
    });

    observer.observe(heroSection);
  };

  // FIXED: Setup unmute buttons for MP4 videos - NOW WORKS FOR BOTH MUTE AND UNMUTE
  const setupUnmute = () => {
    const unmuteButtons = root.querySelectorAll('.unmute-btn, .sports-unmute-btn');

    unmuteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        console.log('Unmute button clicked');
        
        // Find the video in the current active section
        const activeSection = root.querySelector('.sport-section.active');
        if (!activeSection) {
          console.error('No active section found');
          return;
        }
        
        const video = activeSection.querySelector('video.hero-video') || 
                      activeSection.querySelector('video.gender-video');
        if (!video) {
          console.error('No video found in active section');
          return;
        }

        // Ensure video has source
        ensureSrcFromData(video);

        // Toggle mute state FIRST before trying to play
        if (video.muted) {
          // Unmute
          video.muted = false;
          video.volume = 1.0; // Ensure volume is up
          btn.innerHTML = '🔇 Click to Mute';
          console.log('Video unmuted, volume:', video.volume);
          
          // Try to play if paused
          if (video.paused) { 
            video.play().catch((err) => {
              console.error('Could not play video:', err);
            });
          }
        } else {
          // Mute
          video.muted = true;
          btn.innerHTML = '🔊 Click for Sound';
          console.log('Video muted');
        }
      });
    });
  };

  // Auto-mute videos when scrolling away - FIXED TO ACTUALLY WORK
  const setupAutoMute = () => {
    const checkVideoVisibility = () => {
      const activeSection = root.querySelector('.sport-section.active');
      if (!activeSection) return;
      
      const video = activeSection.querySelector('video.hero-video') || 
                    activeSection.querySelector('video.gender-video');
      if (!video || !video.src) return;
      
      const rect = video.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      // If video is out of view and not muted, mute it
      if (!isVisible && !video.muted) {
        video.muted = true;
        const btn = activeSection.querySelector('.unmute-btn, .sports-unmute-btn');
        if (btn) btn.innerHTML = '🔊 Click for Sound';
        console.log('Video auto-muted - scrolled out of view');
      }
    };

    // Check on scroll with throttling
    let scrollTimer;
    window.addEventListener('scroll', () => {
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => {
        scrollTimer = null;
        checkVideoVisibility();
      }, 100);
    }, { passive: true });
  };

  // Filter sports cards by gender
  const filterSportsByGender = () => {
    root.querySelectorAll('.sport-card[data-gender]').forEach(card => {
      const cardGender = (card.getAttribute('data-gender') || '').toLowerCase();

      if (cardGender === 'mixed' || cardGender === '') return;

      if ((gender === 'female' && cardGender === 'male') ||
          (gender === 'male' && cardGender === 'female')) {
        card.style.display = 'none';
      }
    });
  };

  // FIXED: Add personalised sports content - NOW WITH PROPER FALLBACK
  const addSportsContent = () => {
    const childName = ctx.childName || 'Child';

    // Build specificSports array from various shapes of ctx
    let specificSports = [];
    if (Array.isArray(ctx.specificSports) && ctx.specificSports.length > 0) {
      specificSports = ctx.specificSports;
    } else if (ctx.sport1 || ctx.sport2 || ctx.sport3) {
      if (ctx.sport1) specificSports.push(ctx.sport1);
      if (ctx.sport2) specificSports.push(ctx.sport2);
      if (ctx.sport3) specificSports.push(ctx.sport3);
    } else if (ctx.activities?.specificSports) {
      specificSports = Array.isArray(ctx.activities.specificSports)
        ? ctx.activities.specificSports
        : [ctx.activities.specificSports];
    }
    console.log('Processed specificSports array:', specificSports);

    // Update sports interest note
    const sportNote = root.querySelector('.sport-interest-note');
    if (sportNote) {
      if (Array.isArray(ctx.activities) && ctx.activities.includes('sports')) {
        sportNote.textContent = `${childName}, with your passion for sports already evident, `;
      } else {
        sportNote.textContent = `${childName}, `;
      }
    }

    // Update chosen sports highlight
    const highlight = root.querySelector('.chosen-sports-highlight');
    if (highlight) {
      if (specificSports.length > 0) {
        const sports = specificSports.slice(0, 3).join(' • ') + ' • Plus Many More Sports to Explore';
        highlight.textContent = sports;
      } else {
        highlight.textContent = 'Hockey • Athletics • Tennis • Plus Many More Sports to Explore';
      }
    }

    // Sport details mapping - COMPLETE LIST
    const sportDetails = {
      'Hockey': {
        title: 'Hockey Excellence',
        details: `${childName}, you'll train on our two Olympic-standard water-based Astro pitches alongside 20+ teams of passionate players. With professional coaching from former international players, you'll develop advanced stick skills, tactical awareness, and game intelligence. Regular fixtures against top schools like Millfield and Marlborough, plus National Finals appearances, will challenge you at the highest level.`,
        highlight: `U18 National Finals 2024 • Perfect for ${childName}`
      },
      'Athletics': {
        title: 'Athletics Programme',
        details: `${childName}, our athletics facilities will be your training ground for excellence. Whether you excel in sprints, middle-distance, throws, or jumps, our specialist coaches will develop your technique through biomechanical analysis. You'll compete in prestigious events including English Schools Championships and ISA Championships.`,
        highlight: `3 National Medallists • County Champions • Ideal for ${childName}`
      },
      'Tennis': {
        title: 'Tennis Development',
        details: `${childName}, with 12 hard courts, 6 grass courts, and 4 indoor courts at your disposal, you'll have year-round opportunities to perfect your game. Our LTA licensed coaches provide both individual and group coaching tailored to your skill level.`,
        highlight: `National Schools Finalists • LTA Regional Centre`
      },
      'Rugby': {
        title: 'Rugby Excellence',
        details: `${childName}, you'll join 15+ teams from U13 to 1st XV competing at the highest level. Twelve full-size pitches including floodlit training areas provide the perfect environment for your development.`,
        highlight: `U18 National Champions • England Internationals`
      },
      'Netball': {
        title: 'Netball Excellence',
        details: `${childName}, you'll compete with 12 teams from U13 to 1st VII at regional and national level. Six outdoor courts and indoor facilities provide year-round training opportunities.`,
        highlight: `Regional Champions • National Top 10`
      },
      'Cricket': {
        title: 'Cricket Excellence',
        details: `${childName}, you'll train on our professional standard cricket square with 12 pitches. Indoor cricket centre with bowling machines and video analysis provides year-round development.`,
        highlight: `County Cup Winners • MCC Coaching`
      },
      'Swimming': {
        title: 'Swimming Excellence',
        details: `${childName}, you'll train in our 25m six-lane heated indoor pool with electronic timing systems. Daily squad training from 6:30am develops competitive swimming skills.`,
        highlight: `Regional Champions • 8 County Swimmers`
      },
      'Rowing': {
        title: 'Rowing Excellence',
        details: `${childName}, our state-of-the-art boathouse on River Severn houses a fleet of 50+ boats. Compete at Henley Royal Regatta and National Schools' Regatta.`,
        highlight: `Henley Qualifiers • GB Juniors Pipeline`
      },
      'Squash': {
        title: 'Squash Excellence',
        details: `${childName}, you'll train on four glass-backed championship courts in our dedicated squash centre. Professional coaching from former PSA tour players provides individual support.`,
        highlight: `Top 10 UK School • County Training Venue`
      },
      'Badminton': {
        title: 'Badminton Excellence',
        details: `${childName}, you'll compete in our four-court sports hall with specialist badminton flooring. Teams compete in National Schools Championships and county leagues.`,
        highlight: `County Champions • Regional Finals`
      },
      'Basketball': {
        title: 'Basketball Excellence',
        details: `${childName}, you'll play on indoor courts with professional hoops and electronic scoreboards. Boys' and girls' teams compete in regional leagues with American-style coaching methods.`,
        highlight: `Regional League Winners • National Schools Qualifiers`
      },
      'Football': {
        title: 'Football Excellence',
        details: `${childName}, you'll train on our 3G all-weather pitch and multiple grass pitches. FA qualified coaches including UEFA B license holders provide expert guidance.`,
        highlight: `ISFA Regional Champions • County Cup Semi-Finals`
      },
      'Cross Country': {
        title: 'Cross Country Excellence',
        details: `${childName}, you'll train across beautiful countryside routes with specialist distance coaching. Our winter programme builds endurance and mental toughness.`,
        highlight: `County Champions • Regional Competitors`
      },
      'Golf': {
        title: 'Golf Excellence',
        details: `${childName}, you'll benefit from partnerships with Cotswold Hills and Lilley Brook Golf Clubs. PGA professional coaching with video analysis and Trackman technology.`,
        highlight: `ISGA Finals • 3 County Players`
      },
      'Equestrian': {
        title: 'Equestrian Excellence',
        details: `${childName}, comprehensive programme covering showjumping, eventing, dressage, and polo. Partnership with local BHS approved centres. NSEA competitions including Schools Championships at Hickstead.`,
        highlight: `NSEA National Qualifiers • Hickstead Competitors`
      },
      'Clay Shooting': {
        title: 'Clay Shooting Excellence',
        details: `${childName}, partnership with premier local shooting grounds. CPSA qualified instruction in all disciplines. Compete in Schools Challenge and NSRA championships.`,
        highlight: `Schools Challenge Finalists • CPSA Registered`
      },
      'Polo': {
        title: 'Polo Excellence',
        details: `${childName}, introduction to polo at Edgeworth Polo Club. HPA coaching with horses provided. Compete in SUPA schools tournaments.`,
        highlight: `SUPA Tournament Players • HPA Affiliated`
      },
      'Water Polo': {
        title: 'Water Polo Excellence',
        details: `${childName}, train in our 25m pool with dedicated equipment. Boys' and girls' teams competing in regional leagues.`,
        highlight: `Regional League • National Schools Competition`
      },
      'Volleyball': {
        title: 'Volleyball Excellence',
        details: `${childName}, indoor volleyball in sports hall with competition-standard nets. Teams compete in National Schools competitions.`,
        highlight: `Regional Competitors • Fastest Growing Sport`
      },
      'Ultimate Frisbee': {
        title: 'Ultimate Frisbee Excellence',
        details: `${childName}, mixed teams competing in school tournaments. Participate in UK Ultimate Junior tournaments.`,
        highlight: `National Schools Tournament • Inclusive Sport Award`
      },
      'Lacrosse': {
        title: 'Lacrosse Excellence',
        details: `${childName}, you'll join our growing lacrosse programme with specialist coaching and competitive fixtures against other schools.`,
        highlight: `Growing Programme • Competitive Fixtures`
      },
      'Rounders': {
        title: 'Rounders Excellence',
        details: `${childName}, summer term sport with teams from U13 to 1st IX. County tournament participation including Lady Taverners competitions.`,
        highlight: `County Tournament Winners • Regional Finals`
      }
    };

    // FIXED: Update top sport cards with proper fallback
    const topCards = root.querySelectorAll('.top-sport-card');
    
    if (topCards.length > 0) {
      // If we have specific sports, populate with those
      if (specificSports.length > 0) {
        topCards.forEach((card, index) => {
          if (index < specificSports.length) {
            const sport = specificSports[index];

            const badge = card.querySelector('.top-sport-badge');
            const title = card.querySelector('.sport-name');
            const details = card.querySelector('.sport-details');
            const highlightEl = card.querySelector('.sport-highlight');

            if (badge) badge.innerHTML = `<span class="child-name">${childName.toUpperCase()}</span>'S CHOICE #${index + 1}`;

            if (sportDetails[sport]) {
              if (title) title.textContent = sportDetails[sport].title;
              if (details) details.textContent = sportDetails[sport].details;
              if (highlightEl) highlightEl.textContent = sportDetails[sport].highlight;
            } else {
              if (title) title.textContent = sport;
              if (details) details.textContent = `${childName}, you'll develop your ${sport.toLowerCase()} skills with our professional coaching and excellent facilities.`;
              if (highlightEl) highlightEl.textContent = `Excellence in ${sport} • Perfect for ${childName}`;
            }

            // Ensure card is visible
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.visibility = 'visible';
          } else {
            // Hide extra cards if we have fewer sports than cards
            card.style.display = 'none';
          }
        });
      } else {
        // NO SPECIFIC SPORTS - Show default popular sports instead of hiding everything
        const defaultSports = ['Hockey', 'Athletics', 'Tennis'];
        
        topCards.forEach((card, index) => {
          if (index < defaultSports.length) {
            const sport = defaultSports[index];
            
            const badge = card.querySelector('.top-sport-badge');
            const title = card.querySelector('.sport-name');
            const details = card.querySelector('.sport-details');
            const highlightEl = card.querySelector('.sport-highlight');

            if (badge) badge.innerHTML = `<span class="child-name">${childName.toUpperCase()}</span>'S CHOICE #${index + 1}`;

            if (sportDetails[sport]) {
              if (title) title.textContent = sportDetails[sport].title;
              if (details) details.textContent = sportDetails[sport].details;
              if (highlightEl) highlightEl.textContent = sportDetails[sport].highlight;
            }

            // Ensure card is visible
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.visibility = 'visible';
          } else {
            card.style.display = 'none';
          }
        });
      }
    }
    
    // Don't hide the entire section even if no specific sports
    const topSportsSection = root.querySelector('.student-sports-section');
    if (topSportsSection) {
      topSportsSection.style.display = 'block';
      topSportsSection.style.opacity = '1';
      topSportsSection.style.visibility = 'visible';
    }
  };

  // FIXED: Auto-hide hero content - 10 seconds on mobile, 20 seconds on desktop
  const setupHeroContentHiding = () => {
    const startHideTimer = () => {
      const activeSection = root.querySelector('.sport-section.active');
      if (!activeSection) return;

      const heroContent = activeSection.querySelector('.hero-content');
      if (!heroContent) return;

      // Clear any existing timer
      if (heroContent._hideTimer) {
        clearTimeout(heroContent._hideTimer);
      }

      // Check if mobile and set appropriate delay
      const isMobile = window.innerWidth <= 768;
      const hideDelay = isMobile ? 10000 : 20000; // 10 seconds mobile, 20 seconds desktop
      
      console.log(`Setting hide timer: ${hideDelay/1000} seconds (mobile: ${isMobile})`);

      // Start timer
      heroContent._hideTimer = setTimeout(() => {
        heroContent.classList.add('hide');
        console.log('Hero content hidden');
      }, hideDelay);
    };

    // Start timer on initial load
    startHideTimer();

    // Restart timer when tabs are clicked
    const tabs = root.querySelectorAll('.sport-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        setTimeout(() => {
          const activeSection = root.querySelector('.sport-section.active');
          const heroContent = activeSection?.querySelector('.hero-content');
          if (heroContent) {
            // Reset hide state
            heroContent.classList.remove('hide');
            // Restart timer with appropriate delay
            startHideTimer();
          }
        }, 100);
      });
    });

    // Recalculate on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const activeSection = root.querySelector('.sport-section.active');
        const heroContent = activeSection?.querySelector('.hero-content');
        if (heroContent && !heroContent.classList.contains('hide')) {
          startHideTimer(); // Restart with new timing based on screen size
        }
      }, 250);
    });
  };

  // Initialise in correct order
  console.log('Initializing sports module components...');
  setupGenderContent();
  setupTabs();
  setupVideoLazyLoading();
  setupUnmute();
  setupAutoMute();
  filterSportsByGender();
  addSportsContent();
  setupHeroContentHiding(); // Now includes mobile 10-second timer

  // Lazy load images
  if (typeof hydrateLazyAssets === 'function') {
    hydrateLazyAssets(root);
  }

  console.log('Sports module initialization complete');
};

/* CCF Module initializer - Add to MODULES object in app.js */
/* CCF Module – MP4 version, fully scoped and self-contained */
/* ===== CCF Module (mirrors hero MP4 behaviour) ===== */
MODULES['ccf'] = (root, ctx) => {
  const $ = (sel, p = root) => p.querySelector(sel);
  const $$ = (sel, p = root) => Array.from(p.querySelectorAll(sel));

  // Personalisation
  const applyNames = () => {
    const name = (ctx?.childName || '').trim();
    const fallback = 'Your child';
    $$('.child-name', root).forEach(el => {
      el.textContent = (name && !name.startsWith('[')) ? name : fallback;
    });
  };
  applyNames();

  // VIDEO SETUP
  let isMuted = true;
  
  const primeVideo = (video) => {
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    if (!video.hasAttribute('loop')) video.setAttribute('loop', '');
    if (!video.hasAttribute('preload')) video.setAttribute('preload', 'metadata');
    video.removeAttribute('autoplay');
  };

  const loadVideo = (video) => {
    if (!video) return;
    console.log('Loading CCF video');

    primeVideo(video);

    if (!video._dbgBound) {
      video.addEventListener('loadedmetadata', () => console.log('CCF video metadata loaded'));
      video.addEventListener('canplay', () => console.log('CCF video can play'));
      video.addEventListener('error', (e) => console.error('CCF video error:', e));
      video._dbgBound = true;
    }

    video.play().then(() => {
      console.log('CCF video playing');
    }).catch(e => {
      console.log('CCF autoplay deferred:', e?.name || e);
    });
  };

  // LAZY LOAD VIDEO ON SCROLL
  const video = $('.ccf-video');
  const heroSection = $('.ccf-hero');
  const overlay = $('#ccfOverlay');
  const audioBtn = $('#ccfAudioToggle');
  const audioIcon = $('#ccfAudioIcon');
  
  if (video && heroSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('CCF hero entered viewport - starting video');
          loadVideo(video);
          
          // Fade out text after 15 seconds
          setTimeout(() => {
            if (overlay) {
              overlay.style.transition = 'opacity 1s ease-out';
              overlay.style.opacity = '0';
            }
          }, 15000);
          
          observer.unobserve(heroSection);
        }
      });
    }, {
      threshold: 0.4,
      rootMargin: '0px 0px -10% 0px'
    });

    observer.observe(heroSection);
  }

  // AUTO-MUTE ON SCROLL AWAY
  const handleScroll = () => {
    if (!video || !heroSection) return;
    
    const rect = heroSection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (!isVisible && !video.muted) {
      video.muted = true;
      isMuted = true;
      if (audioIcon) audioIcon.textContent = 'Click to unmute';
      console.log('CCF video auto-muted - scrolled away');
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });

  // AUDIO TOGGLE
  const updateMuteLabel = () => {
    if (!audioIcon) return;
    audioIcon.textContent = isMuted ? 'Click to unmute' : 'Click to mute';
  };
  updateMuteLabel();
  
  if (audioBtn && video) {
    audioBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      video.muted = isMuted;
      updateMuteLabel();
      
      if (!isMuted && video.paused) {
        video.play().catch(() => {});
      }
    });
  }

  // SCROLL INDICATOR
  const scrollHint = $('#ccfScrollIndicator');
  
  if (scrollHint) {
    setTimeout(() => {
      scrollHint.classList.add('show');
    }, 2000);
    
    scrollHint.addEventListener('click', () => {
      const servicesSection = root.querySelector('.ccf-services-section');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
};



/* ====== Loader (fetch + mount on intersection) ====== */
/* ====== Updated Module Loader with CSS Support ====== */
async function fetchModuleHTML(key){
  try{
    const res = await fetch(`/modules/${key}.html`, {credentials:'same-origin'});
    if(!res.ok) return null;
    return await res.text();
  }catch(e){
    return null;
  }
}

// NEW: Load module-specific CSS
async function loadModuleCSS(key){
  // Check if CSS already loaded
  if(document.querySelector(`link[data-module="${key}"]`)) return;
  
  // Check if CSS file exists
  try {
    const res = await fetch(`/css/${key}.css`, {method: 'HEAD'});
    if(!res.ok) return; // No CSS for this module
    
    // Create and inject link tag
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/css/${key}.css?v=${Date.now()}`;
    link.setAttribute('data-module', key);
    document.head.appendChild(link);
    
    console.debug(`[CSS] Loaded styles for module: ${key}`);
  } catch(e) {
    // No CSS file for this module, that's OK
  }
}

async function mountPlaceholder(ph){
  const key = ph.getAttribute('data-mod');
  if(!key) return;

  // Visibility rules
  const required = ph.hasAttribute('data-required');
  if(!required && !visibleByRules(ph, CTX)) { ph.remove(); return; }

  // Load CSS first (parallel with HTML)
  const [html] = await Promise.all([
    fetchModuleHTML(key),
    loadModuleCSS(key)  // NEW: Load CSS in parallel
  ]);
  
  if(!html){ ph.remove(); console.info(`Skipped missing module: ${key}`); return; }

  // Replace placeholder with module
  const tmp = document.createElement('div'); 
  tmp.innerHTML = html.trim();
  const section = tmp.firstElementChild;

  if(!(section && section.matches('.mod'))) {
    const wrap = document.createElement('section');
    wrap.className = `mod mod--${key}`; 
    wrap.dataset.mod = key; 
    wrap.innerHTML = html;
    ph.replaceWith(wrap);
    hydrateLazyAssets(wrap);
    MODULES[key]?.(wrap, CTX);
    track('module-mounted', {key});
    return;
  }

  ph.replaceWith(section);
  hydrateLazyAssets(section);
  MODULES[key]?.(section, CTX);
  track('module-mounted', {key});
}

function track(event, data={}){ console.debug('[track]', event, data); }

/* ====== Intersection-based lazy loading ====== */
function initObserver(){
  const phs = $$('.placeholder');
  if(!('IntersectionObserver' in window)) {
    phs.forEach(ph => mountPlaceholder(ph));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const ph = entry.target;
        io.unobserve(ph);
        mountPlaceholder(ph);
      }
    });
  }, { root:null, rootMargin:'200px 0px', threshold:0.01 });

  // Priority order
  phs.sort((a,b) => (parseInt(a.dataset.priority||50) - parseInt(b.dataset.priority||50)))
     .forEach(ph => io.observe(ph));
}

/* ====== Boot ====== */
document.addEventListener('DOMContentLoaded', initObserver);



MODULES['third_form'] = (root, ctx) => {
  // Update names
  root.querySelectorAll('.child-name').forEach(el => {
    const fallback = el.getAttribute('data-fallback') || 'your child';
    const name = (ctx.childName || '').trim();
    el.textContent = name && !name.startsWith('[') ? name : fallback;
  });

  // Personalized intro
  const intro = root.querySelector('.personalized-intro');
  if (intro && ctx.childName) {
    let text = `${ctx.childName} will `;
    if (ctx.priorities?.academic === 3) {
      text += 'find the academic rigour perfect for university preparation.';
    } else if (ctx.activities?.includes('leadership')) {
      text += 'develop leadership skills through our comprehensive programme.';
    } else {
      text += 'discover their passions and build lasting friendships.';
    }
    intro.textContent = text;
  }

  // Show/hide pathways based on interests
  const pathways = {
    '.sciences-pathway': ctx.academicInterests?.includes('sciences'),
    '.mathematics-pathway': ctx.academicInterests?.includes('mathematics'),
    '.business-note': ctx.academicInterests?.includes('business'),
    '.drama-note': ctx.activities?.includes('drama')
  };

  Object.entries(pathways).forEach(([selector, show]) => {
    const el = root.querySelector(selector);
    if (el) el.style.display = show ? 'block' : 'none';
  });

  // University aspirations
  const uniNote = root.querySelector('.university-prep-note');
  if (uniNote) {
    if (ctx.universityAspirations === 'Oxford or Cambridge') {
      uniNote.textContent = 'Early preparation for Oxbridge begins here with top set placement and academic excellence.';
    } else if (ctx.universityAspirations === 'Russell Group') {
      uniNote.textContent = 'Building the strong academic foundation essential for Russell Group applications.';
    }
  }

  // NAVIGATION FUNCTIONALITY - THIS IS WHAT WAS MISSING!
  const navButtons = root.querySelectorAll('.nav-btn');
  const sectionCards = root.querySelectorAll('.section-card');

  navButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      
      // Update active button
      navButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter sections
      sectionCards.forEach(card => {
        if (filter === 'all') {
          card.classList.remove('hidden');
        } else {
          if (card.getAttribute('data-section') === filter) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        }
      });
    });
  });

  // COLLAPSIBLE SUBSECTIONS - ALSO MISSING!
  const subsectionTitles = root.querySelectorAll('.subsection-title');
  
  subsectionTitles.forEach(title => {
    title.addEventListener('click', function() {
      const subsection = this.closest('.subsection');
      if (subsection) {
        subsection.classList.toggle('collapsed');
      }
    });
  });

  // Lazy load images
  if (typeof hydrateLazyAssets === 'function') {
    hydrateLazyAssets(root);
  }
};
/* Third Form Sciences Module Initializer - Add to MODULES object in app.js */
MODULES['third_form_sciences'] = (root, ctx) => {
  // Update name placeholders
  const updateNamePlaceholders = () => {
      root.querySelectorAll('.child-name').forEach(element => {
          element.textContent = ctx.childName || '[Child\'s Name]';
      });
      
      root.querySelectorAll('.parent-name').forEach(element => {
          element.textContent = ctx.parentName || '[Parent Name]';
      });
      
      root.querySelectorAll('.family-name').forEach(element => {
          element.textContent = ctx.familyName || '[Family Name]';
      });
  };

  // Customize welcome message
  const customizeWelcomeMessage = () => {
      const welcomeText = root.querySelector('.personalized-welcome-text');
      if (welcomeText && ctx.academicInterests) {
          let message = 'Discover how our STEM programme will ';
          
          if (ctx.academicInterests.includes('sciences') && ctx.academicInterests.includes('mathematics')) {
              message += 'build on your strong interests in both sciences and mathematics, developing the analytical skills essential for top university entry';
          } else if (ctx.academicInterests.includes('sciences')) {
              message += 'develop your scientific understanding through hands-on investigation and analytical thinking';
          } else if (ctx.academicInterests.includes('mathematics')) {
              message += 'strengthen your mathematical problem-solving abilities and logical thinking skills';
          } else if (ctx.priorities?.academic === 3) {
              message += 'provide the rigorous academic foundation essential for university success';
          } else {
              message += 'develop your analytical thinking and problem-solving skills across all four core STEM subjects';
          }
          
          message += '.';
          welcomeText.textContent = message;
      }
  };

  // Prioritize subjects based on interests
  const prioritizeSubjects = () => {
      if (ctx.academicInterests?.includes('mathematics')) {
          root.querySelector('.subject-card.mathematics')?.classList.add('priority-match');
      }
      
      if (ctx.academicInterests?.includes('sciences')) {
          root.querySelector('.subject-card.physics')?.classList.add('priority-match');
          root.querySelector('.subject-card.chemistry')?.classList.add('priority-match');
          root.querySelector('.subject-card.biology')?.classList.add('priority-match');
      }
      
      if (ctx.priorities?.academic === 3) {
          root.querySelectorAll('.subject-card').forEach(card => {
              if (!card.classList.contains('priority-match')) {
                  card.classList.add('priority-match');
              }
          });
      }
  };

  // Add personalized content sections
  const addPersonalizedContent = () => {
      const childName = ctx.childName || '[Child\'s Name]';
      const pronoun = ctx.childGender === 'female' ? 'her' : 'his';
      const pronounCap = ctx.childGender === 'female' ? 'she' : 'he';
      
      // Mathematics personalization
      const mathPersonalizedContent = root.querySelector('.mathematics-personalized-content');
      if (mathPersonalizedContent) {
          let content = 'In our Mathematics programme, ';
          
          if (ctx.academicInterests?.includes('mathematics')) {
              content += `${childName} will excel in ${pronoun} mathematical studies through our ability-set system, with opportunities for early IGCSE entry and progression to Additional Mathematics.`;
          } else if (ctx.priorities?.academic === 3) {
              content += `${childName} will develop the logical thinking and problem-solving skills essential for academic excellence across all subjects.`;
          } else {
              content += `${childName} will develop analytical thinking skills through challenging problem-solving in our supportive ability-set system.`;
          }
          
          mathPersonalizedContent.innerHTML = `<p>${content}</p>`;
      }

      // Mathematics pathway section
      const mathPathwayContent = root.querySelector('.mathematics-pathway-content');
      if (mathPathwayContent) {
          let content = '';
          
          if (ctx.academicInterests?.includes('mathematics') && ctx.priorities?.academic === 3) {
              content = `With ${childName}'s strong mathematical interests and high academic priorities, ${pronounCap} will likely be placed in our top set, working towards early IGCSE entry in Fourth Form and targeting Grade 9 achievement.`;
          } else if (ctx.academicInterests?.includes('mathematics')) {
              content = `${childName}'s mathematical interests suggest ${pronounCap} will thrive in our advanced sets, with regular assessment ensuring optimal challenge and progression.`;
          } else if (ctx.priorities?.academic === 3) {
              content = `With ${childName}'s high academic priorities, our ability-set system will ensure ${pronounCap} receives appropriate mathematical challenge while building solid foundations.`;
          } else {
              content = `Based on ${childName}'s mathematical background and interests, ${pronounCap} will be placed in the most appropriate set to challenge and support ${pronoun} development.`;
          }
          
          mathPathwayContent.innerHTML = `<p>${content}</p>`;
      }

      // Biology personalization
      const biologyPersonalizedContent = root.querySelector('.biology-personalized-content');
      if (biologyPersonalizedContent) {
          let content = 'In our Biology programme, ';
          
          if (ctx.academicInterests?.includes('sciences')) {
              content += `${childName} will explore the fascinating complexity of life through practical investigation, developing the scientific inquiry skills essential for advanced study.`;
          } else if (ctx.activities?.includes('outdoors')) {
              content += `${childName} will connect classroom learning with the natural world through fieldwork and ecological investigations.`;
          } else {
              content += `${childName} will explore the fascinating world of living organisms through practical investigation and scientific discovery.`;
          }
          
          biologyPersonalizedContent.innerHTML = `<p>${content}</p>`;
      }

      // Chemistry personalization
      const chemistryPersonalizedContent = root.querySelector('.chemistry-personalized-content');
      if (chemistryPersonalizedContent) {
          let content = 'In our Chemistry programme, ';
          
          if (ctx.academicInterests?.includes('sciences')) {
              content += `${childName} will master the central science that connects physics and biology, developing laboratory skills essential for scientific careers.`;
          } else if (ctx.priorities?.academic === 3) {
              content += `${childName} will develop rigorous analytical thinking through systematic study of matter and its interactions.`;
          } else {
              content += `${childName} will discover how matter works at the molecular level while developing essential laboratory skills.`;
          }
          
          chemistryPersonalizedContent.innerHTML = `<p>${content}</p>`;
      }

      // Physics personalization
      const physicsPersonalizedContent = root.querySelector('.physics-personalized-content');
      if (physicsPersonalizedContent) {
          let content = 'In our Physics programme, ';
          
          if (ctx.academicInterests?.includes('mathematics') && ctx.academicInterests?.includes('sciences')) {
              content += `${childName} will excel in applying mathematical skills to understand the fundamental laws governing the universe.`;
          } else if (ctx.academicInterests?.includes('sciences')) {
              content += `${childName} will discover the elegant mathematical relationships that govern natural phenomena through practical investigation.`;
          } else if (ctx.activities?.includes('technology')) {
              content += `${childName} will explore how physics principles apply to modern technology and engineering applications.`;
          } else {
              content += `${childName} will discover the fundamental laws that govern everything from motion to energy through mathematical analysis.`;
          }
          
          physicsPersonalizedContent.innerHTML = `<p>${content}</p>`;
      }

      // Similar personalization for other subject sections...
      // (This is abbreviated for space - you'd continue with all the other personalized sections)
  };

  // Customize navigation
  const customizeNavigation = () => {
      const navButtons = root.querySelectorAll('.nav-btn');
      
      if (ctx.academicInterests?.includes('sciences') || ctx.academicInterests?.includes('mathematics')) {
          navButtons.forEach(button => {
              const filter = button.getAttribute('data-filter');
              
              if (filter === 'mathematics' && ctx.academicInterests?.includes('mathematics')) {
                  button.classList.add('priority-high');
              }
              if ((filter === 'biology' || filter === 'chemistry' || filter === 'physics') && ctx.academicInterests?.includes('sciences')) {
                  button.classList.add('priority-high');
              }
          });
      }
  };

  // Subject filtering functionality
  const filterSubjects = (category) => {
      const subjects = root.querySelectorAll('.subject-card');
      
      subjects.forEach(subject => {
          if (category === 'all' || subject.dataset.subject === category) {
              subject.classList.remove('hidden');
          } else {
              subject.classList.add('hidden');
          }
      });
  };

  // Initialize navigation buttons
  const initializeNavigation = () => {
      const navButtons = root.querySelectorAll('.nav-btn');
      
      navButtons.forEach(button => {
          button.addEventListener('click', function() {
              const filter = this.getAttribute('data-filter');
              
              // Update active state
              navButtons.forEach(btn => btn.classList.remove('active'));
              this.classList.add('active');
              
              // Filter subjects
              filterSubjects(filter);
          });
      });
  };

  // Initialize collapsible sections
  const initializeCollapsibles = () => {
      const sectionTitles = root.querySelectorAll('.section-title');
      
      sectionTitles.forEach(title => {
          title.addEventListener('click', function() {
              const section = this.parentElement;
              section.classList.toggle('collapsed');
          });
      });
  };

  // Add hover effects to stats
  const initializeStatsAnimation = () => {
      const stats = root.querySelectorAll('.stat');
      
      stats.forEach(stat => {
          stat.addEventListener('mouseenter', () => {
              stat.style.transform = 'translateY(-5px) scale(1.05)';
          });
          
          stat.addEventListener('mouseleave', () => {
              stat.style.transform = 'translateY(0) scale(1)';
          });
      });
  };

  // Lazy load images
  if (typeof hydrateLazyAssets === 'function') {
      hydrateLazyAssets(root);
  }

  // Execute all initialization functions
  updateNamePlaceholders();
  customizeWelcomeMessage();
  prioritizeSubjects();
  addPersonalizedContent();
  customizeNavigation();
  initializeNavigation();
  initializeCollapsibles();
  initializeStatsAnimation();

  console.log('Third Form module initialized for:', ctx.childName);
};
/* Third Form Creative Arts module initializer */
MODULES['third_form_creative_arts'] = (root, ctx) => {
  // Update all name placeholders
  $$('.child-name', root).forEach(el => el.textContent = ctx.childName);
  $$('.parent-name', root).forEach(el => el.textContent = ctx.parentName || '[Parent Name]');
  $$('.family-name', root).forEach(el => el.textContent = ctx.familyName || '[Family Name]');

  // Lazy load images
  hydrateLazyAssets(root);

  // Customize welcome message based on interests
  const welcomeText = $('.personalized-welcome-text', root);
  if (welcomeText) {
    let message = 'Discover how our Creative Arts & Design programme will nurture your ';
    
    if (ctx.academicInterests?.includes('arts')) {
      message += 'artistic talents and creative vision';
    } else if (ctx.activities?.includes('arts')) {
      message += 'creative interests and practical skills';
    } else {
      message += 'creative potential and design thinking abilities';
    }
    
    message += ', preparing you for GCSE study and beyond.';
    welcomeText.textContent = message;
  }

  // Personalize Art content
  const artPersonalizedContent = $('.art-personalized-content', root);
  if (artPersonalizedContent) {
    const gender = ctx.gender === 'female' ? 'her' : 'his';
    let content = 'In our Art programme, ';
    
    if (ctx.academicInterests?.includes('arts')) {
      content += `${ctx.childName} will develop ${gender} artistic vision through hands-on exploration of Fine Art, Ceramics, and Printmaking. With your strong interest in the arts, you'll thrive in our supportive creative environment where risk-taking and experimentation are encouraged.`;
    } else if (ctx.priorities?.arts === 3) {
      content += `${ctx.childName} will discover ${gender} creative potential through structured exploration of different artistic mediums. Our three-specialist rotation ensures comprehensive exposure to various creative techniques.`;
    } else {
      content += `${ctx.childName} will develop creative confidence through structured exploration of different artistic mediums, building essential skills for visual communication and personal expression.`;
    }
    
    artPersonalizedContent.innerHTML = `<p>${content}</p>`;
  }

  // Personalize Design Technology content
  const designTechContent = $('.design-tech-personalized-content', root);
  if (designTechContent) {
    const gender = ctx.gender === 'female' ? 'her' : 'his';
    let content = 'In our Design Technology programme, ';
    
    if (ctx.activities?.includes('technology') || ctx.academicInterests?.includes('design')) {
      content += `${ctx.childName} will excel in hands-on problem-solving, developing ${gender} technical skills through real-world design challenges. Your interest in technology and design makes this programme particularly exciting for your development.`;
    } else if (ctx.priorities?.academic === 3) {
      content += `${ctx.childName} will develop practical skills while learning to solve real-world problems through innovative design. The programme's GCSE preparation focus aligns perfectly with your academic priorities.`;
    } else {
      content += `${ctx.childName} will develop practical skills while learning to solve real-world problems through innovative design, building confidence in both textiles and resistant materials.`;
    }
    
    designTechContent.innerHTML = `<p>${content}</p>`;
  }

  // Highlight subjects based on interests
  const artCard = $('.subject-card.art', root);
  const designCard = $('.subject-card.design-technology', root);
  
  if (ctx.academicInterests?.includes('arts') || ctx.priorities?.arts === 3) {
    artCard?.classList.add('priority-match');
  }
  
  if (ctx.academicInterests?.includes('design') || ctx.activities?.includes('technology')) {
    designCard?.classList.add('priority-match');
  }

  // Navigation filtering functionality
  $$('.nav-btn', root).forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      $$('.nav-btn', root).forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      const filter = btn.getAttribute('data-filter');
      const cards = $$('.subject-card', root);
      
      cards.forEach(card => {
        if (filter === 'all' || card.classList.contains(filter)) {
          card.style.display = 'block';
          card.classList.remove('hidden');
        } else {
          card.style.display = 'none';
          card.classList.add('hidden');
        }
      });
    });
  });

  // Highlight navigation based on priorities
  $$('.nav-btn', root).forEach(button => {
    const filter = button.getAttribute('data-filter');
    
    if (filter === 'art' && (ctx.academicInterests?.includes('arts') || ctx.priorities?.arts === 3)) {
      button.classList.add('priority-high');
    } else if (filter === 'design-technology' && (ctx.academicInterests?.includes('design') || ctx.activities?.includes('technology'))) {
      button.classList.add('priority-high');
    }
  });
};
/* Third Form Languages module initializer */
MODULES['third_form_languages'] = (root, ctx) => {
  // Update all name placeholders
  $$('.child-name', root).forEach(el => el.textContent = ctx.childName || '[Child\'s Name]');
  $$('.parent-name', root).forEach(el => el.textContent = ctx.parentName || '[Parent Name]');
  $$('.family-name', root).forEach(el => el.textContent = ctx.familyName || '[Family Name]');

  // Lazy load images
  hydrateLazyAssets(root);

  // Customize welcome message based on interests
  const welcomeText = $('.personalized-welcome-text', root);
  if (welcomeText) {
    let message = 'Discover how language learning will ';
    
    if (ctx.academicInterests?.includes('languages')) {
      message += 'build on your existing language interests to open up a world of cultural understanding and global opportunities';
    } else if (ctx.academicInterests?.includes('humanities')) {
      message += 'complement your humanities interests while developing cultural awareness and analytical thinking skills';
    } else if (ctx.universityAspirations === 'International') {
      message += 'prepare you for international study opportunities and global career prospects';
    } else {
      message += 'open up a world of cultural understanding and global opportunities';
    }
    
    message += '.';
    welcomeText.textContent = message;
  }

  // Prioritize languages based on interests
  if (ctx.academicInterests?.includes('languages')) {
    $('.subject-card.french', root)?.classList.add('priority-match');
    $('.subject-card.spanish', root)?.classList.add('priority-match');
  }
  
  if (ctx.academicInterests?.includes('classics') || ctx.academicInterests?.includes('humanities')) {
    $('.subject-card.latin', root)?.classList.add('priority-match');
    $('.subject-card.classical-civilisation', root)?.classList.add('priority-match');
  }
  
  if (ctx.universityAspirations === 'International') {
    $('.subject-card.french', root)?.classList.add('priority-match');
    $('.subject-card.spanish', root)?.classList.add('priority-match');
    $('.subject-card.german', root)?.classList.add('priority-match');
  }

  // Personalize French content
  const frenchContent = $('.french-personalized-content', root);
  if (frenchContent) {
    const gender = ctx.gender === 'female' ? 'her' : 'his';
    let content = 'In our French programme, ';
    
    if (ctx.academicInterests?.includes('languages')) {
      content += `${ctx.childName} will build on ${gender} existing language interests, developing sophisticated communication skills through cultural immersion and authentic experiences in Montpellier.`;
    } else if (ctx.universityAspirations === 'International') {
      content += `${ctx.childName} will develop the cultural awareness and language skills essential for international study and global career opportunities.`;
    } else {
      content += `${ctx.childName} will develop sophisticated communication skills while exploring French culture and history through immersive learning experiences.`;
    }
    
    frenchContent.innerHTML = `<p>${content}</p>`;
  }

  // Personalize Spanish content
  const spanishContent = $('.spanish-personalized-content', root);
  if (spanishContent) {
    let content = 'In our Spanish programme, ';
    
    if (ctx.academicInterests?.includes('languages')) {
      content += `${ctx.childName} will explore the vibrant cultures of the Spanish-speaking world while developing practical language skills through our Salamanca immersion experiences.`;
    } else if (ctx.activities?.includes('community')) {
      content += `${ctx.childName} will connect with diverse Hispanic cultures, perfect for someone interested in community engagement and global understanding.`;
    } else {
      content += `${ctx.childName} will explore the rich cultures of Spanish-speaking countries while developing practical language skills for global communication.`;
    }
    
    spanishContent.innerHTML = `<p>${content}</p>`;
  }

  // Personalize German content
  const germanContent = $('.german-personalized-content', root);
  if (germanContent) {
    let content = 'In our German programme, ';
    
    if (ctx.priorities?.academic === 3) {
      content += `${ctx.childName} will develop systematic thinking skills through structured grammar learning, perfect for someone with strong academic priorities.`;
    } else if (ctx.academicInterests?.includes('languages')) {
      content += `${ctx.childName} will discover the logical structure of German while exploring German culture through our Berlin exchange programmes.`;
    } else {
      content += `${ctx.childName} will develop systematic thinking skills through structured grammar learning and cultural discovery.`;
    }
    
    germanContent.innerHTML = `<p>${content}</p>`;
  }

  // Personalize Latin content
  const latinContent = $('.latin-personalized-content', root);
  if (latinContent) {
    const gender = ctx.gender === 'female' ? 'her' : 'his';
    let content = 'In our Latin programme, ';
    
    if (ctx.academicInterests?.includes('classics') || ctx.academicInterests?.includes('humanities')) {
      content += `${ctx.childName} will excel in the rigorous analytical thinking that Latin develops, complementing ${gender} interests in classical studies and humanities.`;
    } else if (ctx.priorities?.academic === 3) {
      content += `${ctx.childName} will develop the logical thinking and academic rigour that Latin provides, essential for high academic achievement.`;
    } else {
      content += `${ctx.childName} will develop rigorous analytical skills while exploring the foundations of Western civilization through the Cambridge Latin Course.`;
    }
    
    latinContent.innerHTML = `<p>${content}</p>`;
  }

  // Personalize Classical Civilisation content
  const classicalContent = $('.classical-personalized-content', root);
  if (classicalContent) {
    const gender = ctx.gender === 'female' ? 'her' : 'his';
    let content = 'In our Classical Civilisation programme, ';
    
    if (ctx.academicInterests?.includes('humanities')) {
      content += `${ctx.childName} will explore the foundations of Western culture, perfectly complementing ${gender} humanities interests through study of ancient civilizations.`;
    } else if (ctx.activities?.includes('leadership')) {
      content += `${ctx.childName} will study the leadership and governance of ancient civilizations, developing insights valuable for modern leadership roles.`;
    } else {
      content += `${ctx.childName} will explore the foundations of Western culture while developing analytical and interpretive skills through study of ancient worlds.`;
    }
    
    classicalContent.innerHTML = `<p>${content}</p>`;
  }

  // Personalize EAL content
  const ealContent = $('.eal-personalized-content', root);
  if (ealContent) {
    let content = 'In our EAL programme, ';
    
    if (ctx.universityAspirations === 'International') {
      content += `${ctx.childName} will develop academic English skills essential for international study success while building confidence across all subjects.`;
    } else {
      content += `${ctx.childName} will develop academic English skills while building confidence for success across all subjects in the British curriculum.`;
    }
    
    ealContent.innerHTML = `<p>${content}</p>`;
  }

  // Navigation filtering functionality
  $$('.nav-btn', root).forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      $$('.nav-btn', root).forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      const filter = btn.getAttribute('data-filter');
      const cards = $$('.subject-card', root);
      
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.subject === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // Highlight navigation based on priorities
  if (ctx.academicInterests?.includes('languages')) {
    $$('.nav-btn', root).forEach(button => {
      const filter = button.getAttribute('data-filter');
      if (filter !== 'all') {
        button.classList.add('priority-high');
      }
    });
  }

  // Collapsible sections
  $$('.section-title', root).forEach(title => {
    title.addEventListener('click', function() {
      const section = this.parentElement;
      section.classList.toggle('collapsed');
    });
  });
};
/* Special Programmes Module Initializer - Add this to the MODULES object in app.js */
MODULES['special_programmes'] = (root, ctx) => {
  // Update name placeholders
  const updateNames = () => {
      root.querySelectorAll('.child-name').forEach(el => {
          el.textContent = ctx.childName || '[Child\'s Name]';
      });
  };

  // Customize welcome message
  const customizeWelcome = () => {
      const welcomeText = root.querySelector('.sp-welcome-text');
      if (!welcomeText) return;
      
      let message = 'Discover how our special programmes will ';
      
      if (ctx.activities?.includes('music') && ctx.activities?.includes('leadership')) {
          message += 'develop your musical talents and leadership potential through diverse enrichment opportunities';
      } else if (ctx.activities?.includes('music')) {
          message += 'nurture your musical interests while developing essential skills for academic and personal success';
      } else if (ctx.activities?.includes('leadership')) {
          message += 'develop your leadership potential and broaden your horizons through challenging activities';
      } else if (ctx.activities?.includes('technology')) {
          message += 'advance your technology skills while developing research abilities and creative expression';
      } else if (ctx.priorities?.activities === 3) {
          message += 'provide diverse opportunities to explore your interests and develop new talents';
      } else {
          message += 'develop your talents and interests beyond the academic curriculum through enriching experiences';
      }
      
      message += '.';
      welcomeText.textContent = message;
  };

  // Prioritize programmes based on interests
  const prioritizeProgrammes = () => {
      // Highlight programmes based on interests
      if (ctx.activities?.includes('music') || ctx.academicInterests?.includes('music')) {
          root.querySelector('.sp-card[data-programme="music"]')?.classList.add('priority-match');
      }
      
      if (ctx.activities?.includes('technology') || ctx.academicInterests?.includes('technology')) {
          root.querySelector('.sp-card[data-programme="computing"]')?.classList.add('priority-match');
      }
      
      if (ctx.priorities?.academic === 3) {
          root.querySelector('.sp-card[data-programme="fpq"]')?.classList.add('priority-match');
          root.querySelector('.sp-card[data-programme="skills"]')?.classList.add('priority-match');
      }
      
      if (ctx.activities?.includes('leadership') || ctx.priorities?.activities === 3) {
          root.querySelector('.sp-card[data-programme="challenge"]')?.classList.add('priority-match');
      }
      
      if (ctx.priorities?.pastoral === 3) {
          root.querySelector('.sp-card[data-programme="floreat"]')?.classList.add('priority-match');
      }
  };

  // Add personalized content to programmes
  const addPersonalizedContent = () => {
      const childName = ctx.childName || '[Child\'s Name]';
      const pronoun = ctx.childGender === 'female' ? 'her' : 'his';
      const pronounSubject = ctx.childGender === 'female' ? 'she' : 'he';

      // Music personalization
      const musicPersonal = root.querySelector('.sp-music-personal .sp-section-content');
      if (musicPersonal) {
          let content = 'In our Music programme, ';
          
          if (ctx.activities?.includes('music')) {
              content += `${childName} will build on ${pronoun} musical interests through ensemble performance, composition using industry-standard software, and mini-recital opportunities that build confidence.`;
          } else if (ctx.activities?.includes('leadership')) {
              content += `${childName} will develop creative expression and collaborative leadership skills through ensemble music-making and performance opportunities.`;
          } else {
              content += `${childName} will develop creative expression and collaborative skills through ensemble performance and digital composition using professional software.`;
          }
          
          musicPersonal.innerHTML = `<p>${content}</p>`;
      }

      // Computing personalization
      const computingPersonal = root.querySelector('.sp-computing-personal .sp-section-content');
      if (computingPersonal) {
          let content = 'In our Computing programme, ';
          
          if (ctx.activities?.includes('technology')) {
              content += `${childName} will advance ${pronoun} technology interests through differentiated learning that builds on existing experience while introducing coding and computational thinking.`;
          } else if (ctx.priorities?.academic === 3) {
              content += `${childName} will develop essential digital literacy and programming skills that support academic excellence across all subjects.`;
          } else {
              content += `${childName} will develop digital literacy and programming skills essential for academic success and modern life.`;
          }
          
          computingPersonal.innerHTML = `<p>${content}</p>`;
      }

      // FPQ personalization
      const fpqPersonal = root.querySelector('.sp-fpq-personal .sp-section-content');
      if (fpqPersonal) {
          let content = 'In the FPQ programme, ';
          
          if (ctx.priorities?.academic === 3) {
              content += `${childName} will excel in developing the independent research and academic writing skills essential for future academic success and university preparation.`;
          } else if (ctx.universityAspirations === 'Oxford or Cambridge') {
              content += `${childName} will develop the sophisticated research and analytical skills highly valued by competitive universities, preparing for the EPQ in Upper College.`;
          } else {
              content += `${childName} will develop independent research skills through a personally meaningful project that builds academic confidence and preparation.`;
          }
          
          fpqPersonal.innerHTML = `<p>${content}</p>`;
      }

      // Skills Programme personalization
      const skillsPersonal = root.querySelector('.sp-skills-personal .sp-section-content');
      if (skillsPersonal) {
          let content = 'In the Skills Programme, ';
          
          if (ctx.priorities?.academic === 3) {
              content += `${childName} will develop the organizational and study techniques essential for maintaining academic excellence across multiple demanding subjects.`;
          } else {
              content += `${childName} will develop the organizational and study techniques essential for academic success and effective time management.`;
          }
          
          skillsPersonal.innerHTML = `<p>${content}</p>`;
      }

      // Challenge Programme personalization
      const challengePersonal = root.querySelector('.sp-challenge-personal .sp-section-content');
      if (challengePersonal) {
          let content = 'In Third Form Challenge, ';
          
          if (ctx.activities?.includes('leadership')) {
              content += `${childName} will excel in developing ${pronoun} leadership potential through Dragons' Den presentations, coding challenges, and collaborative activities.`;
          } else if (ctx.activities?.includes('technology')) {
              content += `${childName} will particularly enjoy the coding day and Dragons' Den presentations that combine technology skills with creative problem-solving.`;
          } else if (ctx.activities?.includes('sports')) {
              content += `${childName} will thrive in the athletic development components including squash, rowing, and cross-country activities that complement regular sports.`;
          } else {
              content += `${childName} will develop leadership skills and explore new activities through this diverse and engaging Wednesday afternoon programme.`;
          }
          
          challengePersonal.innerHTML = `<p>${content}</p>`;
      }

      // Floreat personalization
      const floreatPersonal = root.querySelector('.sp-floreat-personal .sp-section-content');
      if (floreatPersonal) {
          let content = 'In Floreat, ';
          
          if (ctx.priorities?.pastoral === 3) {
              content += `${childName} will develop the emotional intelligence and personal resilience essential for thriving during this important developmental stage.`;
          } else if (ctx.activities?.includes('leadership')) {
              content += `${childName} will develop the emotional intelligence and social skills that enhance ${pronoun} leadership potential and community engagement.`;
          } else {
              content += `${childName} will develop emotional intelligence and personal resilience during this important stage of ${pronoun} development.`;
          }
          
          floreatPersonal.innerHTML = `<p>${content}</p>`;
      }

      // Update personalized intro texts based on interests
      const musicIntro = root.querySelector('.sp-music-intro p');
      if (musicIntro && ctx.activities?.includes('music')) {
          musicIntro.textContent = `Music will build on ${childName}'s musical interests through performance, composition, and collaborative opportunities.`;
      }

      const computingIntro = root.querySelector('.sp-computing-intro p');
      if (computingIntro && ctx.activities?.includes('technology')) {
          computingIntro.textContent = `Computing will advance ${childName}'s technology skills through coding and digital innovation projects.`;
      }

      const fpqIntro = root.querySelector('.sp-fpq-intro p');
      if (fpqIntro && ctx.priorities?.academic === 3) {
          fpqIntro.textContent = `FPQ will develop ${childName}'s research capabilities essential for academic excellence and university success.`;
      }

      const skillsIntro = root.querySelector('.sp-skills-intro p');
      if (skillsIntro && ctx.priorities?.academic === 3) {
          skillsIntro.textContent = `Skills Programme will equip ${childName} with advanced study techniques for maintaining academic excellence.`;
      }

      const challengeIntro = root.querySelector('.sp-challenge-intro p');
      if (challengeIntro && ctx.activities?.includes('leadership')) {
          challengeIntro.textContent = `Third Form Challenge will develop ${childName}'s leadership potential through diverse and challenging activities.`;
      }

      const floreatIntro = root.querySelector('.sp-floreat-intro p');
      if (floreatIntro && ctx.priorities?.pastoral === 3) {
          floreatIntro.textContent = `Floreat will provide ${childName} with comprehensive wellbeing support during this important developmental stage.`;
      }
  };

  // Setup navigation filtering
  const setupNavigation = () => {
      const navButtons = root.querySelectorAll('.sp-nav-btn');
      const cards = root.querySelectorAll('.sp-card');
      
      // Highlight priority navigation buttons based on interests
      navButtons.forEach(btn => {
          const filter = btn.getAttribute('data-filter');
          
          if (filter === 'music' && (ctx.activities?.includes('music') || ctx.academicInterests?.includes('music'))) {
              btn.classList.add('priority-high');
          }
          if (filter === 'computing' && (ctx.activities?.includes('technology') || ctx.academicInterests?.includes('technology'))) {
              btn.classList.add('priority-high');
          }
          if (filter === 'fpq' && ctx.priorities?.academic === 3) {
              btn.classList.add('priority-high');
          }
          if (filter === 'skills' && ctx.priorities?.academic === 3) {
              btn.classList.add('priority-high');
          }
          if (filter === 'challenge' && (ctx.activities?.includes('leadership') || ctx.priorities?.activities === 3)) {
              btn.classList.add('priority-high');
          }
          if (filter === 'floreat' && ctx.priorities?.pastoral === 3) {
              btn.classList.add('priority-high');
          }
      });
      
      // Add click handlers for filtering
      navButtons.forEach(btn => {
          btn.addEventListener('click', () => {
              // Remove active class from all buttons
              navButtons.forEach(b => b.classList.remove('active'));
              // Add active class to clicked button
              btn.classList.add('active');
              
              const filter = btn.getAttribute('data-filter');
              
              cards.forEach(card => {
                  const programme = card.getAttribute('data-programme');
                  if (filter === 'all' || programme === filter) {
                      card.style.display = 'block';
                      card.classList.remove('hidden');
                  } else {
                      card.style.display = 'none';
                      card.classList.add('hidden');
                  }
              });
          });
      });
  };

  // Initialize the module
  updateNames();
  customizeWelcome();
  prioritizeProgrammes();
  addPersonalizedContent();
  setupNavigation();
};
/* Third Form Humanities Module Initializer - Add this to the MODULES object in app.js */
MODULES['third_form_humanities'] = (root, ctx) => {
  // Update name placeholders
  const updateNames = () => {
      root.querySelectorAll('.child-name').forEach(el => {
          el.textContent = ctx.childName || '[Child\'s Name]';
      });
  };

  // Customize welcome message
  const customizeWelcome = () => {
      const welcomeTitle = root.querySelector('.hum-welcome-title');
      const welcomeText = root.querySelector('.hum-welcome-text');
      
      if (welcomeTitle && welcomeText) {
          const childName = ctx.childName || '[Child\'s Name]';
          welcomeTitle.textContent = `${childName}'s Humanities Journey`;
          
          let message = `Discover how our Humanities subjects will develop ${childName}'s `;
          
          if (ctx.activities?.includes('leadership')) {
              message += "leadership communication skills and critical thinking abilities essential for ";
          } else {
              message += "critical thinking and communication skills essential for ";
          }
          
          if (ctx.universityAspirations === 'Oxford or Cambridge') {
              message += `Oxbridge success.`;
          } else if (ctx.universityAspirations === 'Russell Group') {
              message += `Russell Group university success.`;
          } else {
              message += `university preparation and future success.`;
          }
          
          welcomeText.textContent = message;
      }
  };

  // Prioritize subjects based on interests
  const prioritizeSubjects = () => {
      const subjects = root.querySelectorAll('.hum-card');
      
      subjects.forEach(subject => {
          const subjectType = subject.dataset.subject;
          let priority = 'medium';
          
          // Determine priority based on user preferences
          if (ctx.academicInterests?.includes('humanities') && ctx.priorities?.academic === 3) {
              priority = 'high';
          } else if (subjectType === 'english' && ctx.activities?.includes('leadership')) {
              priority = 'high';
          } else if (subjectType === 'english' && ctx.activities?.includes('drama')) {
              priority = 'high';
          } else if (subjectType === 'history' && ctx.academicInterests?.includes('humanities')) {
              priority = 'high';
          }
          
          subject.classList.add(`priority-${priority}`);
      });
  };

  // Personalize subject introductions
  const personalizeSubjects = () => {
      const childName = ctx.childName || '[Child\'s Name]';
      const pronoun = ctx.childGender === 'female' ? 'her' : 'his';
      const pronounSubject = ctx.childGender === 'female' ? 'she' : 'he';

      // English personalization
      const englishIntro = root.querySelector('.hum-english-intro');
      if (englishIntro) {
          const title = englishIntro.querySelector('h4');
          const text = englishIntro.querySelector('p');
          
          if (ctx.activities?.includes('leadership')) {
              title.textContent = `Perfect for ${childName}'s Leadership Development`;
              text.textContent = `English will help ${childName} develop the articulate communication and persuasive writing skills essential for the leadership roles ${pronounSubject}'s interested in pursuing.`;
          } else if (ctx.activities?.includes('drama')) {
              title.textContent = `${childName}'s Creative Expression Journey`;
              text.textContent = `English will nurture ${childName}'s dramatic and creative interests while developing the analytical skills needed for academic success.`;
          } else {
              title.textContent = `Perfect for ${childName}'s Development`;
              text.textContent = `English will help ${childName} develop the articulate communication and analytical writing skills that will serve throughout ${pronoun} academic career and into university life.`;
          }
      }

      // History personalization
      const historyIntro = root.querySelector('.hum-history-intro');
      if (historyIntro) {
          const title = historyIntro.querySelector('h4');
          const text = historyIntro.querySelector('p');
          
          title.textContent = `${childName}'s Analytical Skills Journey`;
          text.textContent = `History will develop ${childName}'s critical analysis and evidence evaluation skills, building the intellectual rigor needed for ${pronoun} university aspirations.`;
      }

      // Geography personalization
      const geographyIntro = root.querySelector('.hum-geography-intro');
      if (geographyIntro) {
          const title = geographyIntro.querySelector('h4');
          const text = geographyIntro.querySelector('p');
          
          if (ctx.academicInterests?.includes('sciences')) {
              title.textContent = `${childName}'s Scientific & Analytical Approach`;
              text.textContent = `Geography bridges ${childName}'s scientific interests with humanities analysis, providing the interdisciplinary skills valued by top universities.`;
          } else {
              title.textContent = `Scientific & Analytical Approach`;
              text.textContent = `Geography combines scientific investigation with analytical skills, bridging science and humanities for ${childName}'s well-rounded development.`;
          }
      }

      // TPE personalization
      const tpeIntro = root.querySelector('.hum-tpe-intro');
      if (tpeIntro) {
          const title = tpeIntro.querySelector('h4');
          const text = tpeIntro.querySelector('p');
          
          if (ctx.activities?.includes('leadership')) {
              title.textContent = `${childName}'s Ethical Leadership Development`;
              text.textContent = `TPE develops the ethical reasoning and cultural understanding essential for ${childName}'s leadership aspirations and university-level discourse.`;
          } else {
              title.textContent = `Ethical Reasoning & Cultural Understanding`;
              text.textContent = `TPE develops ${childName}'s critical thinking about values and ethics, essential skills for leadership and university-level discourse.`;
          }
      }
  };

  // Customize pathways based on interests
  const customizePathways = () => {
      const childName = ctx.childName || '[Child\'s Name]';
      const pronoun = ctx.childGender === 'female' ? 'her' : 'his';
      const pronounSubject = ctx.childGender === 'female' ? 'she' : 'he';

      // Show/hide pathways based on interests
      const pathwayMappings = {
          'hum-university-pathway': true, // Always show
          'hum-humanities-pathway': ctx.academicInterests?.includes('humanities'),
          'hum-leadership-pathway': ctx.activities?.includes('leadership'),
          'hum-creative-pathway': ctx.academicInterests?.includes('arts') || ctx.activities?.includes('drama')
      };

      Object.entries(pathwayMappings).forEach(([className, shouldShow]) => {
          const elements = root.querySelectorAll(`.${className}`);
          elements.forEach(element => {
              element.style.display = shouldShow ? 'block' : 'none';
          });
      });

      // Personalize university pathway content
      const universityPathways = root.querySelectorAll('.hum-university-pathway');
      universityPathways.forEach(pathway => {
          const heading = pathway.querySelector('h5');
          const text = pathway.querySelector('p');
          
          if (heading && text) {
              if (pathway.closest('.hum-card[data-subject="english"]')) {
                  heading.textContent = `${childName}'s University Preparation`;
                  
                  if (ctx.universityAspirations === 'Oxford or Cambridge') {
                      text.textContent = `English will develop ${childName}'s critical analysis and essay writing skills essential for Oxbridge applications. ${childName}'s strong English grades will demonstrate the communication abilities Oxford and Cambridge value across all disciplines.`;
                  } else if (ctx.universityAspirations === 'Russell Group') {
                      text.textContent = `English will develop ${childName}'s critical analysis and essay writing skills essential for Russell Group applications. ${childName}'s strong English grades will demonstrate the communication abilities universities value across all disciplines.`;
                  } else {
                      text.textContent = `English will develop ${childName}'s critical analysis and essay writing skills essential for university applications. Strong English grades demonstrate the communication abilities universities value across all disciplines.`;
                  }
              }
          }
      });

      // Personalize leadership pathways
      if (ctx.activities?.includes('leadership')) {
          const leadershipPathways = root.querySelectorAll('.hum-leadership-pathway');
          leadershipPathways.forEach(pathway => {
              const heading = pathway.querySelector('h5');
              const text = pathway.querySelector('p');
              
              if (heading && text && pathway.closest('.hum-card[data-subject="english"]')) {
                  heading.textContent = `Developing ${childName}'s Leadership Communication`;
                  text.textContent = `English will develop ${childName}'s articulate speaking and persuasive writing skills essential for the leadership roles ${pronounSubject} is interested in pursuing. ${childName} will gain confidence through presentation opportunities that build the communication skills needed for effective leadership.`;
              }
          });
      }

      // Personalize creative pathways
      if (ctx.academicInterests?.includes('arts') || ctx.activities?.includes('drama')) {
          const creativePathways = root.querySelectorAll('.hum-creative-pathway');
          creativePathways.forEach(pathway => {
              const heading = pathway.querySelector('h5');
              const text = pathway.querySelector('p');
              
              if (heading && text && pathway.closest('.hum-card[data-subject="english"]')) {
                  heading.textContent = `${childName}'s Creative Expression`;
                  text.textContent = `The creative writing elements of English, including ${childName}'s potential participation in the creative writing prize competition, provide outlets for artistic expression whilst developing technical writing skills for university success.`;
              }
          });
      }
  };

  // Setup navigation and highlight priority buttons
  const setupNavigation = () => {
      const navButtons = root.querySelectorAll('.hum-nav-btn');
      const cards = root.querySelectorAll('.hum-card');
      
      // Highlight priority navigation buttons
      navButtons.forEach(button => {
          const filter = button.getAttribute('data-filter');
          
          // Add priority styling for humanities focus
          if (ctx.academicInterests?.includes('humanities') && ctx.priorities?.academic === 3) {
              if (filter === 'english' || filter === 'history') {
                  button.classList.add('priority-high');
              }
          }
          
          if (ctx.activities?.includes('leadership') && filter === 'english') {
              button.classList.add('priority-high');
          }
      });
      
      // Add click handlers for filtering
      navButtons.forEach(btn => {
          btn.addEventListener('click', () => {
              // Remove active class from all buttons
              navButtons.forEach(b => b.classList.remove('active'));
              // Add active class to clicked button
              btn.classList.add('active');
              
              const filter = btn.getAttribute('data-filter');
              
              cards.forEach(card => {
                  const subject = card.getAttribute('data-subject');
                  if (filter === 'all' || subject === filter) {
                      card.style.display = 'block';
                      card.classList.remove('hidden');
                  } else {
                      card.style.display = 'none';
                      card.classList.add('hidden');
                  }
              });
          });
      });
  };

  // Initialize the module
  updateNames();
  customizeWelcome();
  prioritizeSubjects();
  personalizeSubjects();
  customizePathways();
  setupNavigation();
};
/* Upper School Module Initializer - Add this to the MODULES object in app.js */
MODULES['upper_school'] = (root, ctx) => {
  // Update name placeholders
  const updateNames = () => {
      root.querySelectorAll('.child-name').forEach(el => {
          el.textContent = ctx.childName || '[Child\'s Name]';
      });
  };

  // Customize welcome message
  const customizeWelcome = () => {
      const welcomeText = root.querySelector('.us-welcome-text');
      if (!welcomeText) return;
      
      const childName = ctx.childName || '[Child\'s Name]';
      let message = `Discover how our Upper School will prepare ${childName} for `;
      
      if (ctx.universityAspirations === 'Oxford or Cambridge') {
          message += 'Oxbridge success through rigorous academics and comprehensive support.';
      } else if (ctx.universityAspirations === 'Russell Group') {
          message += 'Russell Group university success through rigorous academics and comprehensive support.';
      } else if (ctx.universityAspirations === 'International') {
          message += 'international university opportunities and global career paths.';
      } else {
          message += 'university success and beyond through exceptional teaching and support.';
      }
      
      welcomeText.textContent = message;
  };

  // Prioritize sections based on interests
  const prioritizeSections = () => {
      // Academic section priority
      if (ctx.academicInterests?.length > 0 || ctx.priorities?.academic === 3) {
          root.querySelector('.us-card[data-section="academic"]')?.classList.add('priority-match');
      }
      
      // EPQ priority for academic students
      if (ctx.priorities?.academic === 3 || ctx.universityAspirations === 'Oxford or Cambridge') {
          root.querySelector('.us-card[data-section="epq"]')?.classList.add('priority-match');
      }
      
      // University support priority
      if (ctx.universityAspirations && ctx.universityAspirations !== 'Unsure') {
          root.querySelector('.us-card[data-section="university"]')?.classList.add('priority-match');
      }
      
      // Floreat priority for pastoral care
      if (ctx.priorities?.pastoral >= 2) {
          root.querySelector('.us-card[data-section="floreat"]')?.classList.add('priority-match');
      }
      
      // Results priority for ambitious students
      if (ctx.universityAspirations === 'Russell Group' || ctx.universityAspirations === 'Oxford or Cambridge') {
          root.querySelector('.us-card[data-section="results"]')?.classList.add('priority-match');
      }
  };

  // Add personalized content
  const addPersonalizedContent = () => {
      const childName = ctx.childName || '[Child\'s Name]';
      const pronoun = ctx.childGender === 'female' ? 'her' : 'his';
      const pronounSubject = ctx.childGender === 'female' ? 'she' : 'he';

      // Academic personalization
      const academicPersonal = root.querySelector('.us-academic-personal .us-section-content');
      if (academicPersonal) {
          let content = '';
          
          if (ctx.academicInterests?.includes('sciences') && ctx.academicInterests?.includes('mathematics')) {
              content = `${childName}'s academic journey will leverage ${pronoun} strengths in sciences and mathematics. The combination of rigorous A Levels in these subjects provides the perfect foundation for competitive university applications, particularly for STEM courses at leading universities.`;
          } else if (ctx.academicInterests?.includes('humanities')) {
              content = `${childName}'s academic pathway will build on ${pronoun} humanities interests, developing the analytical writing and critical thinking skills highly valued by universities. Essay-based A Levels provide excellent preparation for ${pronoun} chosen field.`;
          } else if (ctx.academicInterests?.includes('arts')) {
              content = `${childName}'s creative talents will flourish through specialized A Level study in the arts, combined with academic rigor that prepares students for leading creative courses at top universities.`;
          } else {
              content = `${childName}'s academic journey will be tailored to maximize ${pronoun} potential and prepare ${pronoun} for university success through careful subject selection and exceptional teaching support.`;
          }
          
          academicPersonal.innerHTML = `<p>${content}</p>`;
      }

      // EPQ personalization
      const epqPersonal = root.querySelector('.us-epq-personal .us-section-content');
      if (epqPersonal) {
          let content = `${childName}'s EPQ project will develop essential research skills while exploring `;
          
          if (ctx.academicInterests?.includes('sciences')) {
              content += `${pronoun} scientific interests in depth. Recent projects have included cutting-edge topics like CRISPR gene editing, sustainable energy solutions, and AI applications - perfect for demonstrating academic capability to universities.`;
          } else if (ctx.academicInterests?.includes('humanities')) {
              content += `${pronoun} passion for humanities through in-depth historical, philosophical, or literary research. This independent study demonstrates the intellectual curiosity universities seek.`;
          } else if (ctx.activities?.includes('leadership')) {
              content += `leadership themes or social impact topics that align with ${pronoun} interests. This demonstrates both academic capability and personal values to university admissions teams.`;
          } else {
              content += `${pronoun} personal interests in depth, demonstrating the independent learning skills universities value highly.`;
          }
          
          epqPersonal.innerHTML = `<p>${content}</p>`;
      }

      // University personalization
      const universityPersonal = root.querySelector('.us-university-personal .us-section-content');
      if (universityPersonal) {
          let content = `${childName}'s university journey will be supported by comprehensive guidance `;
          
          if (ctx.universityAspirations === 'Oxford or Cambridge') {
              content += `specifically tailored for Oxbridge applications. With dedicated support from Mrs Jo Wintle, our Oxbridge Coordinator, ${childName} will receive mock interview preparation and specialist guidance for entrance assessments.`;
          } else if (ctx.universityAspirations === 'Russell Group') {
              content += `focused on securing places at leading Russell Group universities. Our track record shows consistent success at universities like Bath, Bristol, Durham, and Exeter - exactly the caliber ${childName} is targeting.`;
          } else if (ctx.universityAspirations === 'International') {
              content += `for prestigious international institutions. Mr Nick Nelson provides expert guidance for applications to universities in the USA, Canada, Europe, and Asia.`;
          } else {
              content += `tailored to ${pronoun} aspirations, ensuring ${pronounSubject} achieves a place at ${pronoun} first-choice university.`;
          }
          
          universityPersonal.innerHTML = `<p>${content}</p>`;
      }

      // Floreat personalization
      const floreatPersonal = root.querySelector('.us-floreat-personal .us-section-content');
      if (floreatPersonal) {
          let content = `${childName}'s personal development journey will `;
          
          if (ctx.activities?.includes('leadership')) {
              content += `build on ${pronoun} leadership interests, developing the emotional intelligence and ethical grounding essential for future leadership roles while preparing for university independence.`;
          } else if (ctx.priorities?.pastoral === 3) {
              content += `provide comprehensive wellbeing support during this crucial transition period, ensuring ${pronounSubject} develops the resilience and life skills needed for university success.`;
          } else {
              content += `prepare ${pronoun} for the challenges and opportunities of university life through practical skills development and personal growth opportunities.`;
          }
          
          floreatPersonal.innerHTML = `<p>${content}</p>`;
      }

      // Results personalization
      const resultsPersonal = root.querySelector('.us-results-personal .us-section-content');
      if (resultsPersonal) {
          let content = `${childName} will join our graduates at `;
          
          if (ctx.universityAspirations === 'Oxford or Cambridge') {
              content += `the most prestigious universities. While Oxbridge remains highly competitive, our annual success rate of 4-6 offers from 25 applications demonstrates our preparation quality. ${childName} will also have excellent chances at other leading universities.`;
          } else if (ctx.universityAspirations === 'Russell Group') {
              content += `leading Russell Group universities that align with ${pronoun} academic goals. Our strongest relationships with Bath, Bristol, Durham, and Exeter match perfectly with typical Russell Group aspirations.`;
          } else {
              content += `universities that align with ${pronoun} academic goals and career aspirations, benefiting from our extensive network and proven track record.`;
          }
          
          resultsPersonal.innerHTML = `<p>${content}</p>`;
      }

      // Update intro texts based on interests
      const academicIntro = root.querySelector('.us-academic-intro p');
      if (academicIntro && ctx.priorities?.academic === 3) {
          academicIntro.textContent = `Our rigorous academic structure will provide ${childName} with the perfect foundation for achieving top grades and competitive university admission.`;
      }

      const epqIntro = root.querySelector('.us-epq-intro p');
      if (epqIntro && (ctx.priorities?.academic === 3 || ctx.universityAspirations === 'Oxford or Cambridge')) {
          epqIntro.textContent = `The EPQ will showcase ${childName}'s independent research capabilities, providing crucial differentiation for competitive university applications.`;
      }

      const universityIntro = root.querySelector('.us-university-intro p');
      if (universityIntro && ctx.universityAspirations === 'Russell Group') {
          universityIntro.textContent = `Our comprehensive university support will guide ${childName} to secure offers from target Russell Group universities.`;
      }

      const floreatIntro = root.querySelector('.us-floreat-intro p');
      if (floreatIntro && ctx.activities?.includes('leadership')) {
          floreatIntro.textContent = `Floreat will develop ${childName}'s leadership capabilities and personal resilience for university challenges and future success.`;
      }

      const resultsIntro = root.querySelector('.us-results-intro p');
      if (resultsIntro && (ctx.universityAspirations === 'Russell Group' || ctx.universityAspirations === 'Oxford or Cambridge')) {
          resultsIntro.textContent = `Join our successful graduates at the prestigious universities that match ${childName}'s ambitious aspirations.`;
      }
  };

  // Setup navigation and highlight priorities
  const setupNavigation = () => {
      const navButtons = root.querySelectorAll('.us-nav-btn');
      const cards = root.querySelectorAll('.us-card');
      
      // Highlight priority navigation buttons
      navButtons.forEach(button => {
          const filter = button.getAttribute('data-filter');
          
          if ((filter === 'academic' && (ctx.academicInterests?.length > 0 || ctx.priorities?.academic === 3)) ||
              (filter === 'university' && ctx.universityAspirations && ctx.universityAspirations !== 'Unsure') ||
              (filter === 'epq' && (ctx.priorities?.academic === 3 || ctx.universityAspirations === 'Oxford or Cambridge')) ||
              (filter === 'floreat' && ctx.priorities?.pastoral >= 2) ||
              (filter === 'results' && (ctx.universityAspirations === 'Russell Group' || ctx.universityAspirations === 'Oxford or Cambridge'))) {
              button.classList.add('priority-high');
          }
      });
      
      // Add click handlers for filtering
      navButtons.forEach(btn => {
          btn.addEventListener('click', () => {
              // Remove active class from all buttons
              navButtons.forEach(b => b.classList.remove('active'));
              // Add active class to clicked button
              btn.classList.add('active');
              
              const filter = btn.getAttribute('data-filter');
              
              cards.forEach(card => {
                  const section = card.getAttribute('data-section');
                  if (filter === 'all' || section === filter) {
                      card.style.display = 'block';
                      card.classList.remove('hidden');
                  } else {
                      card.style.display = 'none';
                      card.classList.add('hidden');
                  }
              });
          });
      });
  };

  // Initialize the module
  updateNames();
  customizeWelcome();
  prioritizeSections();
  addPersonalizedContent();
  setupNavigation();
};
/* Applied & Vocational Studies Module Initializer - Add this to the MODULES object in app.js */
MODULES['applied_vocational'] = (root, ctx) => {
  // Update name placeholders
  const updateNames = () => {
    root.querySelectorAll('.child-name').forEach(el => {
      el.textContent = ctx.childName || '[Child\'s Name]';
    });
  };

  // Customize welcome message based on user interests
  const customizeWelcome = () => {
    const welcomeText = root.querySelector('.av-welcome-text');
    if (!welcomeText) return;
    
    const childName = ctx.childName || '[Child\'s Name]';
    let message = `Discover how our applied learning pathways will prepare ${childName} for `;
    
    if (ctx.academicInterests?.includes('business') || ctx.activities?.includes('leadership')) {
      message += 'professional leadership success and business excellence.';
    } else if (ctx.academicInterests?.includes('sciences') && ctx.activities?.includes('sports')) {
      message += 'sports science excellence and performance analysis careers.';
    } else if (ctx.academicInterests?.includes('mathematics') || ctx.activities?.includes('technology')) {
      message += 'technology innovation and computational thinking success.';
    } else if (ctx.universityAspirations === 'Russell Group') {
      message += 'Russell Group university success through applied learning excellence.';
    } else {
      message += 'professional success and university excellence through practical skills development.';
    }
    
    welcomeText.textContent = message;
  };

  // Prioritize subjects based on interests and activities
  const prioritizeSubjects = () => {
    const navButtons = root.querySelectorAll('.av-nav-btn');
    const cards = root.querySelectorAll('.av-card');
    
    // Business Studies prioritization
    if (ctx.academicInterests?.includes('business') || ctx.activities?.includes('leadership')) {
      navButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'business') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        if (card.getAttribute('data-subject') === 'business') {
          card.classList.add('priority-match');
        }
      });
    }
    
    // Computer Science prioritization
    if (ctx.academicInterests?.includes('mathematics') || ctx.activities?.includes('technology')) {
      navButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'computer-science') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        if (card.getAttribute('data-subject') === 'computer-science') {
          card.classList.add('priority-match');
        }
      });
    }
    
    // Psychology prioritization
    if (ctx.academicInterests?.includes('sciences') || ctx.activities?.includes('leadership')) {
      navButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'psychology') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        if (card.getAttribute('data-subject') === 'psychology') {
          card.classList.add('priority-match');
        }
      });
    }
    
    // Sports Science prioritization
    if (ctx.activities?.includes('sports') || ctx.academicInterests?.includes('sciences')) {
      navButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'sports-science') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        if (card.getAttribute('data-subject') === 'sports-science') {
          card.classList.add('priority-match');
        }
      });
    }
  };

  // Personalize content based on context
  const personalizeContent = () => {
    // Business card personalization
    const businessIntro = root.querySelector('#business-card .av-subject-intro');
    if (businessIntro && ctx.activities?.includes('leadership')) {
      businessIntro.textContent = `Perfect for ${ctx.childName || '[Child\'s Name]'}'s leadership interests - dynamic subject exploring organisations globally. Excellent foundation for business-related undergraduate study and ${ctx.universityAspirations || 'university'} applications.`;
    }
    
    // Computer Science personalization for technology interests
    const csIntro = root.querySelector('#cs-card .av-subject-intro');
    if (csIntro && ctx.activities?.includes('technology')) {
      csIntro.textContent = `Ideal for ${ctx.childName || '[Child\'s Name]'}'s technology interests - develop analytical thinking and problem-solving through computational thinking, modelling, analysing, and implementing innovative coding solutions.`;
    }
    
    // Sports Science personalization
    const sportsIntro = root.querySelector('#sports-card .av-subject-intro');
    if (sportsIntro && ctx.activities?.includes('sports')) {
      sportsIntro.textContent = `Perfect for ${ctx.childName || '[Child\'s Name]'}'s sporting interests - deeper understanding of human body performance applying scientific theories to optimise health and athletic excellence.`;
    }
  };

  // Customize navigation title
  const customizeNavigation = () => {
    const navTitle = root.querySelector('.av-nav-title');
    if (navTitle && ctx.childName) {
      navTitle.textContent = `Subjects for ${ctx.childName} - Filter by Interest`;
    }
  };

  // Setup navigation filtering
  const setupNavigation = () => {
    const navButtons = root.querySelectorAll('.av-nav-btn');
    const cards = root.querySelectorAll('.av-card');
    
    // Add click handlers for filtering
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        navButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        cards.forEach(card => {
          const subject = card.getAttribute('data-subject');
          if (filter === 'all' || subject === filter) {
            card.style.display = 'block';
            card.classList.remove('hidden');
          } else {
            card.style.display = 'none';
            card.classList.add('hidden');
          }
        });
      });
    });

    // Add collapsible section functionality
    const sectionTitles = root.querySelectorAll('.av-section-title');
    sectionTitles.forEach(title => {
      title.addEventListener('click', function() {
        const section = this.parentElement;
        section.classList.toggle('collapsed');
      });
    });

    // Add interactivity to stats
    const stats = root.querySelectorAll('.av-stat');
    stats.forEach(stat => {
      stat.addEventListener('mouseenter', () => {
        stat.style.transform = 'translateY(-5px) scale(1.05)';
      });
      
      stat.addEventListener('mouseleave', () => {
        stat.style.transform = 'translateY(0) scale(1)';
      });
    });
  };

  // Initialize the module
  updateNames();
  customizeWelcome();
  prioritizeSubjects();
  personalizeContent();
  customizeNavigation();
  setupNavigation();
};
/* Creative Arts & Design Module Initializer - Add this to the MODULES object in app.js */
MODULES['creative_arts'] = (root, ctx) => {
  // Update name placeholders
  const updateNames = () => {
    root.querySelectorAll('.child-name').forEach(el => {
      el.textContent = ctx.childName || '[Child\'s Name]';
    });
  };

  // Customize welcome message based on creative interests
  const customizeWelcome = () => {
    const welcomeText = root.querySelector('.ca-welcome-text');
    if (!welcomeText) return;
    
    const childName = ctx.childName || '[Child\'s Name]';
    let message = `Discover how our creative programmes will nurture ${childName}'s artistic talents and prepare `;
    
    if (ctx.activities?.includes('drama') && ctx.activities?.includes('music')) {
      message += `${childName} for excellence in both theatre and music through our professional-standard facilities.`;
    } else if (ctx.activities?.includes('drama') && ctx.universityAspirations === 'Oxford or Cambridge') {
      message += `${childName} for Oxbridge success through rigorous creative training and analytical skill development.`;
    } else if (ctx.activities?.includes('music') && ctx.priorities?.activities === 3) {
      message += `${childName} for musical excellence in our All-Steinway School with world-class performance opportunities.`;
    } else if (ctx.academicInterests?.includes('arts') && ctx.academicInterests?.includes('humanities')) {
      message += `${childName} for university success by combining creative expression with critical thinking and cultural analysis.`;
    } else if (ctx.universityAspirations === 'Oxford or Cambridge') {
      message += `${childName} for Oxbridge applications through creative programmes that develop the analytical thinking and cultural knowledge top universities seek.`;
    } else if (ctx.activities?.includes('drama')) {
      message += `${childName} for theatrical success through professional drama training and performance opportunities.`;
    } else if (ctx.activities?.includes('music')) {
      message += `${childName} for musical achievement through exceptional facilities and expert teaching.`;
    } else if (ctx.academicInterests?.includes('arts')) {
      message += `${childName} for creative success through comprehensive arts education and professional preparation.`;
    } else {
      message += `${childName} for creative success and university excellence through exceptional artistic education.`;
    }
    
    welcomeText.textContent = message;
  };

  // Prioritize subjects based on interests and activities
  const prioritizeSubjects = () => {
    const navButtons = root.querySelectorAll('.ca-nav-btn');
    const cards = root.querySelectorAll('.ca-card');
    
    // Drama prioritization
    if (ctx.activities?.includes('drama')) {
      navButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'drama') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        if (card.getAttribute('data-subject') === 'drama') {
          card.classList.add('priority-match');
          addPersonalizedContent(card, ctx, 'drama');
        }
      });
    }
    
    // Music prioritization
    if (ctx.activities?.includes('music')) {
      navButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'music') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        if (card.getAttribute('data-subject') === 'music') {
          card.classList.add('priority-match');
          addPersonalizedContent(card, ctx, 'music');
        }
      });
    }
    
    // Art prioritization
    if (ctx.academicInterests?.includes('arts')) {
      navButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'art' || btn.getAttribute('data-filter') === 'history-of-art') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        const subject = card.getAttribute('data-subject');
        if (subject === 'art' || subject === 'history-of-art') {
          card.classList.add('priority-match');
          addPersonalizedContent(card, ctx, subject);
        }
      });
    }
  };

  // Add personalized content to specific subject cards
  const addPersonalizedContent = (card, ctx, subject) => {
    const cardContent = card.querySelector('.ca-card-content');
    if (!cardContent) return;

    // Remove existing personalized content
    const existingPersonalized = cardContent.querySelector('.ca-personalized-content');
    if (existingPersonalized) {
      existingPersonalized.remove();
    }

    // Create new personalized section
    const personalizedSection = document.createElement('div');
    personalizedSection.className = 'ca-personalized-content';
    personalizedSection.style.cssText = `
      background: rgba(201, 169, 97, 0.1);
      border: 2px solid rgba(201, 169, 97, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      font-weight: 500;
      color: #1e3a5f;
    `;

    let content = '';
    const childName = ctx.childName || '[Child\'s Name]';

    if (subject === 'drama' && ctx.activities?.includes('leadership')) {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">${childName}'s Leadership Through Drama</h4>
      <p>Drama naturally develops leadership skills through directing, devising theatre, and collaborative creation. ${childName} will have opportunities to lead House productions, direct scenes, and mentor younger students - essential experience for university applications and future career success.</p>`;
    } else if (subject === 'drama' && ctx.universityAspirations === 'Oxford or Cambridge') {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Oxbridge Drama Preparation for ${childName}</h4>
      <p>Our Drama A Level provides exceptional preparation for Oxbridge applications. ${childName} will develop the analytical thinking, cultural knowledge, and creative expression that Cambridge and Oxford seek in their most competitive applicants.</p>`;
    } else if (subject === 'music' && ctx.universityAspirations === 'Oxford or Cambridge') {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Oxbridge Music Excellence for ${childName}</h4>
      <p>Our Music programme provides rigorous preparation for Oxbridge music degrees. ${childName} will develop the analytical skills, cultural knowledge, and performance excellence that Cambridge and Oxford music departments seek.</p>`;
    } else if (subject === 'music' && ctx.priorities?.activities === 3) {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Perfect for ${childName}'s Activity Priorities</h4>
      <p>With high priority on activities, ${childName} will thrive in our All-Steinway School environment. Access world-class instruments, perform in premium venues, and participate in international opportunities including Jazz Festival in Montpellier.</p>`;
    } else if (subject === 'art' && ctx.academicInterests?.includes('humanities')) {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Art & Humanities Synergy for ${childName}</h4>
      <p>Art A Level complements humanities studies perfectly, developing visual analysis skills and cultural understanding. ${childName} will explore historical contexts, philosophical themes, and social commentary through creative practice.</p>`;
    } else if (subject === 'history-of-art' && ctx.priorities?.academic === 3) {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Academic Rigour for ${childName}</h4>
      <p>History of Art offers exceptional academic challenge, developing critical analysis, research skills, and cultural literacy. ${childName} will engage with complex philosophical and historical concepts while building analytical writing skills essential for university success.</p>`;
    }

    if (content) {
      personalizedSection.innerHTML = content;
      cardContent.insertBefore(personalizedSection, cardContent.firstChild);
    }
  };

  // Personalize content based on context
  const personalizeContent = () => {
    // Update subject introductions
    const artIntro = root.querySelector('[data-subject="art"] .ca-subject-intro');
    if (artIntro && ctx.childName) {
      artIntro.textContent = `Vibrant and exciting department where ${ctx.childName} will develop life-long love of visual expression. Choose between Fine Art and 3D Design courses suited to students who enjoy individual voice and creative thought.`;
    }

    const dramaIntro = root.querySelector('[data-subject="drama"] .ca-subject-intro');
    if (dramaIntro && ctx.childName && ctx.activities?.includes('leadership')) {
      dramaIntro.textContent = `Perfect for ${ctx.childName}'s leadership interests - inspires students to become independent theatre-makers with skills for higher education and beyond. Emphasising practical creativity alongside research and theoretical understanding.`;
    }

    const musicIntro = root.querySelector('[data-subject="music"] .ca-subject-intro');
    if (musicIntro && ctx.childName && ctx.activities?.includes('music')) {
      musicIntro.textContent = `Ideal for ${ctx.childName}'s musical interests - relevant and contemporary qualification offering chance to study wide range of genres. From Hans Zimmer to Renaissance music, taught in our 'All-Steinway School' facilities.`;
    }
  };

  // Customize navigation title
  const customizeNavigation = () => {
    const navTitle = root.querySelector('.ca-nav-title');
    if (navTitle && ctx.childName) {
      navTitle.textContent = `Creative Subjects for ${ctx.childName}`;
    }
  };

  // Add university-specific content
  const addUniversityContent = () => {
    if (ctx.universityAspirations === 'Oxford or Cambridge') {
      const pathwaysSection = root.querySelector('.ca-pathways-section');
      if (pathwaysSection && !pathwaysSection.querySelector('.ca-oxbridge-note')) {
        const oxbridgeNote = document.createElement('div');
        oxbridgeNote.className = 'ca-oxbridge-note';
        oxbridgeNote.style.cssText = `
          background: rgba(201, 169, 97, 0.15);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1.5rem;
          text-align: center;
        `;
        const childName = ctx.childName || '[Child\'s Name]';
        oxbridgeNote.innerHTML = `
          <h4 style="color: #92400e; margin-bottom: 1rem; font-size: 1.2rem;">Oxbridge Creative Excellence for ${childName}</h4>
          <p style="color: #78350f;">Our creative A Levels provide exceptional preparation for Oxford and Cambridge applications. ${childName} will develop the analytical thinking, cultural knowledge, and creative expression that top universities seek, with dedicated support for portfolio development and university interviews.</p>
        `;
        pathwaysSection.appendChild(oxbridgeNote);
      }
    }
  };

  // Setup navigation filtering
  const setupNavigation = () => {
    const navButtons = root.querySelectorAll('.ca-nav-btn');
    const cards = root.querySelectorAll('.ca-card');
    
    // Add click handlers for filtering
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        navButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        cards.forEach(card => {
          const subject = card.getAttribute('data-subject');
          if (filter === 'all' || subject === filter) {
            card.style.display = 'block';
            card.classList.remove('hidden');
          } else {
            card.style.display = 'none';
            card.classList.add('hidden');
          }
        });
      });
    });

    // Add collapsible section functionality
    const sectionTitles = root.querySelectorAll('.ca-section-title');
    sectionTitles.forEach(title => {
      title.addEventListener('click', function() {
        const section = this.parentElement;
        section.classList.toggle('collapsed');
      });
    });

    // Add interactivity to stats
    const stats = root.querySelectorAll('.ca-stat');
    stats.forEach(stat => {
      stat.addEventListener('mouseenter', () => {
        stat.style.transform = 'translateY(-5px) scale(1.05)';
      });
      
      stat.addEventListener('mouseleave', () => {
        stat.style.transform = 'translateY(0) scale(1)';
      });
    });
  };

  // Initialize the module
  updateNames();
  customizeWelcome();
  prioritizeSubjects();
  personalizeContent();
  customizeNavigation();
  addUniversityContent();
  setupNavigation();
};
/* Sciences & Mathematics Module Initializer - Add this to the MODULES object in app.js */
MODULES['sciences_mathematics'] = (root, ctx) => {
  // Update name placeholders
  const updateNames = () => {
    root.querySelectorAll('.child-name').forEach(el => {
      el.textContent = ctx.childName || '[Child\'s Name]';
    });
  };

  // Customize welcome message based on STEM interests
  const customizeWelcome = () => {
    const welcomeText = root.querySelector('.sm-welcome-text');
    if (!welcomeText) return;
    
    const childName = ctx.childName || '[Child\'s Name]';
    let message = `Discover how our rigorous STEM programmes will develop ${childName}'s analytical thinking and prepare `;
    
    if (ctx.academicInterests?.includes('sciences') && ctx.academicInterests?.includes('mathematics')) {
      message += `${childName} for excellence in both sciences and mathematics, providing the perfect foundation for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge success' : 'competitive university entry'}.`;
    } else if (ctx.academicInterests?.includes('mathematics')) {
      message += `${childName} for mathematical excellence and logical reasoning essential for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge applications' : 'university success'}.`;
    } else if (ctx.academicInterests?.includes('sciences')) {
      message += `${childName} for scientific excellence through experimental investigation and analytical thinking valued by top universities.`;
    } else if (ctx.universityAspirations === 'Oxford or Cambridge') {
      message += `${childName} for Oxbridge success through the analytical and problem-solving skills that Cambridge and Oxford seek in their applicants.`;
    } else {
      message += `${childName} for university success through analytical thinking and scientific literacy essential for modern careers.`;
    }
    
    welcomeText.textContent = message;
  };

  // Prioritize subjects based on interests and activities
  const prioritizeSubjects = () => {
    const navButtons = root.querySelectorAll('.sm-nav-btn');
    const cards = root.querySelectorAll('.sm-card');
    
    // Mathematics prioritization
    if (ctx.academicInterests?.includes('mathematics')) {
      navButtons.forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        if (filter === 'mathematics' || filter === 'further-mathematics') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        const subject = card.getAttribute('data-subject');
        if (subject === 'mathematics' || subject === 'further-mathematics') {
          card.classList.add('priority-match');
          addPersonalizedContent(card, ctx, subject);
        }
      });
    }
    
    // Sciences prioritization
    if (ctx.academicInterests?.includes('sciences')) {
      navButtons.forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        if (filter === 'physics' || filter === 'chemistry' || filter === 'biology') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        const subject = card.getAttribute('data-subject');
        if (subject === 'physics' || subject === 'chemistry' || subject === 'biology') {
          card.classList.add('priority-match');
          addPersonalizedContent(card, ctx, subject);
        }
      });
    }
    
    // Technology/Computer Science prioritization
    if (ctx.activities?.includes('technology')) {
      navButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'computer-science') {
          btn.classList.add('priority-high');
        }
      });
      cards.forEach(card => {
        if (card.getAttribute('data-subject') === 'computer-science') {
          card.classList.add('priority-match');
          addPersonalizedContent(card, ctx, 'computer-science');
        }
      });
    }
  };

  // Add personalized content to specific subject cards
  const addPersonalizedContent = (card, ctx, subject) => {
    const cardContent = card.querySelector('.sm-card-content');
    if (!cardContent) return;

    // Remove existing personalized content
    const existingPersonalized = cardContent.querySelector('.sm-personalized-content');
    if (existingPersonalized) {
      existingPersonalized.remove();
    }

    // Create new personalized section
    const personalizedSection = document.createElement('div');
    personalizedSection.className = 'sm-personalized-content';
    personalizedSection.style.cssText = `
      background: rgba(201, 169, 97, 0.1);
      border: 2px solid rgba(201, 169, 97, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      font-weight: 500;
      color: #1e3a5f;
    `;

    let content = '';
    const childName = ctx.childName || '[Child\'s Name]';

    if (subject === 'mathematics' && ctx.universityAspirations === 'Oxford or Cambridge') {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Oxbridge Mathematics for ${childName}</h4>
      <p>Mathematics A Level is highly desirable for most Oxbridge courses and essential for many STEM subjects. ${childName} will develop the logical reasoning and analytical skills that Cambridge and Oxford value in their applicants, providing excellent preparation for competitive applications.</p>`;
    } else if (subject === 'mathematics' && ctx.academicInterests?.includes('mathematics')) {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Perfect Match for ${childName}</h4>
      <p>Mathematics aligns perfectly with ${childName}'s academic interests. This subject will develop the logical reasoning and problem-solving skills essential for ${ctx.universityAspirations === 'Russell Group' ? 'Russell Group success' : 'competitive university entry'} and future STEM careers.</p>`;
    } else if (subject === 'further-mathematics' && ctx.universityAspirations === 'Oxford or Cambridge') {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Highly Recommended for ${childName}</h4>
      <p>Given ${childName}'s Oxbridge aspirations, Further Mathematics is strongly recommended. This advanced subject provides crucial preparation for Cambridge Mathematics and significant advantages for Oxford applications, demonstrating mathematical excellence to admissions tutors.</p>`;
    } else if (subject === 'physics' && ctx.academicInterests?.includes('sciences')) {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Excellent Choice for ${childName}</h4>
      <p>Physics aligns perfectly with ${childName}'s scientific interests, developing analytical thinking and experimental skills highly valued by ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge' : 'top universities'}. Essential for engineering and physical sciences pathways.</p>`;
    } else if (subject === 'chemistry' && ctx.academicInterests?.includes('sciences')) {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Ideal for ${childName}</h4>
      <p>Chemistry perfectly matches ${childName}'s scientific interests. This central science connects biological and physical worlds, opening doors to medicine, research, and cutting-edge technological careers while providing excellent ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge' : 'university'} preparation.</p>`;
    } else if (subject === 'biology' && ctx.academicInterests?.includes('sciences')) {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Perfect for ${childName}</h4>
      <p>Biology aligns beautifully with ${childName}'s scientific interests, developing investigative and analytical skills essential for medical and biological sciences. Excellent preparation for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'competitive Oxbridge applications' : 'university success'} in healthcare and research.</p>`;
    } else if (subject === 'computer-science' && ctx.activities?.includes('technology')) {
      content = `<h4 style="color: #c9a961; margin-bottom: 1rem;">Great Match for ${childName}</h4>
      <p>Given ${childName}'s interest in technology, Computer Science offers an exciting pathway to develop computational thinking and programming skills increasingly valued across all industries, perfect for the digital economy.</p>`;
    }

    if (content) {
      personalizedSection.innerHTML = content;
      cardContent.insertBefore(personalizedSection, cardContent.firstChild);
    }
  };

  // Personalize subject introductions
  const personalizeContent = () => {
    const childName = ctx.childName || '[Child\'s Name]';
    
    // Update Mathematics intro if it's a priority subject
    if (ctx.academicInterests?.includes('mathematics')) {
      const mathsIntro = root.querySelector('[data-subject="mathematics"] .sm-subject-intro');
      if (mathsIntro) {
        mathsIntro.textContent = `Excellent choice, ${childName}! Mathematics is the foundation of scientific thinking and modern technology. This subject will develop the logical reasoning and problem-solving skills needed for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge success' : 'competitive university entry'}.`;
      }
    }

    // Update sciences intros if relevant
    if (ctx.academicInterests?.includes('sciences')) {
      const physicsIntro = root.querySelector('[data-subject="physics"] .sm-subject-intro');
      if (physicsIntro) {
        physicsIntro.textContent = `Perfect for ${childName}'s scientific interests! Physics develops analytical thinking and experimental skills essential for understanding the physical world, providing excellent preparation for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge' : 'competitive university'} applications in science and engineering.`;
      }

      const chemistryIntro = root.querySelector('[data-subject="chemistry"] .sm-subject-intro');
      if (chemistryIntro) {
        chemistryIntro.textContent = `Excellent choice, ${childName}! Chemistry is the central science that will satisfy scientific curiosity while developing analytical and practical skills needed for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'competitive Oxbridge applications' : 'success at top universities'}.`;
      }

      const biologyIntro = root.querySelector('[data-subject="biology"] .sm-subject-intro');
      if (biologyIntro) {
        biologyIntro.textContent = `Excellent match for ${childName}'s scientific interests! Biology develops understanding of life sciences while building analytical and investigative skills needed for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge success' : 'competitive university applications'}.`;
      }
    }

    // Update Computer Science if technology interest
    if (ctx.activities?.includes('technology')) {
      const csIntro = root.querySelector('[data-subject="computer-science"] .sm-subject-intro');
      if (csIntro) {
        csIntro.textContent = `Perfect for ${childName}'s technology interests! Computer Science will develop computational thinking and programming abilities, preparing for the rapidly evolving digital economy and modern technological careers.`;
      }
    }
  };

  // Customize navigation title
  const customizeNavigation = () => {
    const navTitle = root.querySelector('.sm-nav-title');
    if (navTitle && ctx.childName) {
      if (ctx.academicInterests?.includes('sciences') && ctx.academicInterests?.includes('mathematics')) {
        navTitle.textContent = `${ctx.childName}'s STEM Pathway - Select Subjects`;
      } else if (ctx.academicInterests?.includes('mathematics')) {
        navTitle.textContent = `Mathematics & Related Subjects for ${ctx.childName}`;
      } else if (ctx.academicInterests?.includes('sciences')) {
        navTitle.textContent = `Science Subjects for ${ctx.childName}`;
      } else {
        navTitle.textContent = `STEM Subjects for ${ctx.childName}`;
      }
    }
  };

  // Customize hero subtitle and stats
  const customizeHeroContent = () => {
    const subtitle = root.querySelector('.sm-hero-subtitle');
    if (subtitle) {
      if (ctx.academicInterests?.includes('sciences') && ctx.academicInterests?.includes('mathematics')) {
        subtitle.textContent = `Excellence in STEM Education • Perfect preparation for ${ctx.childName}'s scientific aspirations • Pathway to ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge' : 'Leading Universities'}`;
      } else if (ctx.universityAspirations === 'Oxford or Cambridge') {
        subtitle.textContent = `Excellence in STEM Education • Oxbridge Preparation • Pathway to Cambridge and Oxford Success`;
      }
    }

    // Update stats based on aspirations
    const stats = root.querySelectorAll('.sm-stat');
    if (ctx.universityAspirations === 'Oxford or Cambridge') {
      stats.forEach(stat => {
        const label = stat.querySelector('.sm-stat-label');
        if (label && label.textContent.includes('Oxbridge Requirements')) {
          const number = stat.querySelector('.sm-stat-number');
          if (number) number.textContent = 'A*A*A';
        }
      });
    } else if (ctx.universityAspirations === 'Russell Group') {
      stats.forEach(stat => {
        const label = stat.querySelector('.sm-stat-label');
        if (label && label.textContent.includes('Oxbridge Requirements')) {
          const number = stat.querySelector('.sm-stat-number');
          if (number) number.textContent = 'A*AA';
          label.textContent = 'Russell Group Entry';
        }
      });
    }
  };

  // Add university-specific content
  const addUniversityContent = () => {
    if (ctx.universityAspirations === 'Oxford or Cambridge') {
      const universitySection = root.querySelector('.sm-university-section');
      if (universitySection && !universitySection.querySelector('.sm-oxbridge-note')) {
        const oxbridgeNote = document.createElement('div');
        oxbridgeNote.className = 'sm-oxbridge-note';
        oxbridgeNote.style.cssText = `
          background: rgba(201, 169, 97, 0.15);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1.5rem;
          text-align: center;
        `;
        const childName = ctx.childName || '[Child\'s Name]';
        oxbridgeNote.innerHTML = `
          <h4 style="color: #92400e; margin-bottom: 1rem; font-size: 1.2rem;">Oxbridge STEM Excellence for ${childName}</h4>
          <p style="color: #78350f;">Our STEM programmes provide exceptional preparation for Oxford and Cambridge applications. ${childName} will develop the analytical thinking, problem-solving skills, and academic rigor that top universities seek, with dedicated support for competitive applications and interviews.</p>
        `;
        universitySection.appendChild(oxbridgeNote);
      }
    }
  };

  // Setup navigation filtering
  const setupNavigation = () => {
    const navButtons = root.querySelectorAll('.sm-nav-btn');
    const cards = root.querySelectorAll('.sm-card');
    
    // Add click handlers for filtering
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        navButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        cards.forEach(card => {
          const subject = card.getAttribute('data-subject');
          if (filter === 'all' || subject === filter) {
            card.style.display = 'block';
            card.classList.remove('hidden');
          } else {
            card.style.display = 'none';
            card.classList.add('hidden');
          }
        });
      });
    });

    // Add collapsible section functionality
    const sectionTitles = root.querySelectorAll('.sm-section-title');
    sectionTitles.forEach(title => {
      title.addEventListener('click', function() {
        const section = this.parentElement;
        section.classList.toggle('collapsed');
      });
    });

    // Add interactivity to stats
    const stats = root.querySelectorAll('.sm-stat');
    stats.forEach(stat => {
      stat.addEventListener('mouseenter', () => {
        stat.style.transform = 'translateY(-5px) scale(1.05)';
      });
      
      stat.addEventListener('mouseleave', () => {
        stat.style.transform = 'translateY(0) scale(1)';
      });
    });
  };

  // Initialize the module
  updateNames();
  customizeWelcome();
  prioritizeSubjects();
  personalizeContent();
  customizeNavigation();
  customizeHeroContent();
  addUniversityContent();
  setupNavigation();
};
/* Humanities & Social Sciences Module Initializer - Add to MODULES object in app.js */
MODULES['humanities_social'] = (root, ctx) => {
  // Helper function to get elements
  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => root.querySelectorAll(selector);
  
  // Update child name placeholders
  const nameElements = $$('.child-name', root);
  nameElements.forEach(el => {
    if (ctx.childName) {
      el.textContent = ctx.childName;
    }
  });

  // Personalize welcome message based on student interests
  const welcomeText = $('.hs-welcome-text', root);
  if (welcomeText && ctx.childName) {
    let message = '';
    
    if (ctx.academicInterests?.includes('humanities') || ctx.academicInterests?.includes('social_sciences')) {
      if (ctx.universityAspirations === 'Oxbridge') {
        message = `Discover how our rigorous humanities and social sciences programmes will develop the critical thinking and analytical writing skills essential for Oxbridge success.`;
      } else {
        message = `Explore our humanities and social sciences programmes designed to develop your critical thinking and prepare you for university excellence.`;
      }
    } else if (ctx.activities?.includes('debate') || ctx.activities?.includes('public_speaking')) {
      message = `See how our humanities programmes will enhance your communication and analytical skills through engaging with complex ideas and perspectives.`;
    } else if (ctx.priorities?.academic >= 2) {
      message = `Discover how our humanities and social sciences programmes develop the critical thinking skills valued by universities and employers.`;
    } else {
      message = `Explore our humanities and social sciences programmes that develop analytical thinking and prepare you for university success.`;
    }
    
    welcomeText.textContent = message;
  }

  // Personalize hero subtitle based on interests
  const heroSubtitle = $('.hs-hero-subtitle', root);
  if (heroSubtitle && ctx.academicInterests?.includes('humanities')) {
    heroSubtitle.textContent = `Perfect for students passionate about literature, history, and understanding human society. These subjects develop the analytical and communication skills that open doors to prestigious universities and diverse career paths.`;
  }

  // Navigation filtering functionality
  $$('.hs-nav-btn', root).forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      $$('.hs-nav-btn', root).forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      const filter = btn.getAttribute('data-filter');
      const cards = $$('.hs-card', root);
      
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.subject === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // Highlight priority subjects based on student interests and aspirations
  const prioritizeSubject = (subject, reason) => {
    const card = $(`.hs-card[data-subject="${subject}"]`, root);
    const button = $(`.hs-nav-btn[data-filter="${subject}"]`, root);
    
    if (card) {
      card.classList.add('priority-match');
      // Add personalized content explaining why this subject is recommended
      const existingHighlight = card.querySelector('.hs-priority-highlight');
      if (!existingHighlight) {
        const highlight = document.createElement('div');
        highlight.className = 'hs-priority-highlight';
        highlight.innerHTML = `<strong>Recommended for ${ctx.childName}:</strong> ${reason}`;
        const cardContent = card.querySelector('.hs-card-content');
        if (cardContent) {
          cardContent.insertBefore(highlight, cardContent.firstChild);
        }
      }
    }
    
    if (button) {
      button.classList.add('priority-high');
    }
  };

  // Apply personalized subject recommendations
  if (ctx.academicInterests?.includes('literature') || ctx.activities?.includes('creative_writing')) {
    prioritizeSubject('english', 'Your interest in literature and creative writing makes English Literature an ideal choice for developing analytical and creative skills.');
  }
  
  if (ctx.academicInterests?.includes('history') || ctx.activities?.includes('debate')) {
    prioritizeSubject('history', 'Your interests align perfectly with History, developing research skills and analytical thinking valued by universities.');
  }
  
  if (ctx.academicInterests?.includes('geography') || ctx.activities?.includes('environmental_awareness')) {
    prioritizeSubject('geography', 'Geography combines your interests with essential skills in data analysis and environmental understanding.');
  }
  
  if (ctx.academicInterests?.includes('economics') || ctx.activities?.includes('young_enterprise')) {
    prioritizeSubject('economics', 'Economics perfectly matches your interests and provides valuable analytical skills for business and finance careers.');
  }
  
  if (ctx.activities?.includes('student_council') || ctx.activities?.includes('debate')) {
    prioritizeSubject('politics', 'Your leadership activities and interest in current affairs make Politics an excellent choice for developing understanding of governance and society.');
  }
  
  if (ctx.academicInterests?.includes('psychology') || ctx.activities?.includes('peer_mentoring')) {
    prioritizeSubject('psychology', 'Your interest in understanding human behavior makes Psychology ideal for developing scientific analysis of mind and behavior.');
  }

  // Special EPQ recommendations
  if (ctx.priorities?.academic >= 3 && ctx.universityAspirations === 'Oxbridge') {
    const epqCard = $('.hs-card[data-subject="epq"]', root);
    if (epqCard) {
      epqCard.classList.add('priority-high');
      const cardContent = epqCard.querySelector('.hs-card-content');
      if (cardContent) {
        const oxbridgeNote = document.createElement('div');
        oxbridgeNote.className = 'hs-university-focus';
        oxbridgeNote.innerHTML = `
          <h4>Oxbridge Preparation</h4>
          <p><strong>Essential for ${ctx.childName}:</strong> EPQ demonstrates the independent research skills and academic initiative highly valued by Cambridge and Oxford admissions tutors. Many successful Oxbridge candidates cite their EPQ as crucial preparation for university-level study.</p>
        `;
        cardContent.appendChild(oxbridgeNote);
      }
    }
  }

  // Add subject combinations based on student profile
  const combinationsSection = $('.hs-combinations-section', root);
  if (combinationsSection && ctx.academicInterests) {
    const grid = $('.hs-combinations-grid', root);
    if (grid) {
      // Add personalized combination recommendation
      const personalCombo = document.createElement('div');
      personalCombo.className = 'hs-combination-item hs-interest-match';
      
      let comboTitle = '';
      let comboContent = '';
      
      if (ctx.academicInterests.includes('literature') && ctx.academicInterests.includes('history')) {
        comboTitle = `Perfect for ${ctx.childName}`;
        comboContent = `<p><strong>English Literature + History:</strong> Your combined interests make this an ideal combination for Law, English, or Classical Studies degrees.</p>
                      <p>Both subjects develop the analytical writing and critical thinking skills that universities value most highly.</p>`;
      } else if (ctx.academicInterests.includes('economics') && ctx.academicInterests.includes('geography')) {
        comboTitle = `Recommended for ${ctx.childName}`;
        comboContent = `<p><strong>Geography + Economics:</strong> Perfect for your interests in understanding global systems and economic patterns.</p>
                      <p>Excellent preparation for careers in international development, environmental consulting, or urban planning.</p>`;
      } else if (ctx.universityAspirations === 'Oxbridge') {
        comboTitle = `Oxbridge Strategy for ${ctx.childName}`;
        comboContent = `<p><strong>Your Subject Combination + EPQ:</strong> Focus on achieving A*A*A with EPQ to meet Oxbridge requirements.</p>
                      <p>Choose subjects you're passionate about - Oxford and Cambridge value genuine intellectual curiosity above strategic subject selection.</p>`;
      } else {
        comboTitle = `Tailored for ${ctx.childName}`;
        comboContent = `<p><strong>Your Interests + EPQ:</strong> Any three humanities/social sciences subjects provide excellent preparation for university study.</p>
                      <p>The EPQ will develop the independent research skills essential for degree-level success.</p>`;
      }
      
      personalCombo.innerHTML = `<h3>${comboTitle}</h3>${comboContent}`;
      grid.appendChild(personalCombo);
    }
  }

  // Add activity connections where relevant
  const addActivityConnection = (subject, activity, connection) => {
    const card = $(`.hs-card[data-subject="${subject}"]`, root);
    if (card && ctx.activities?.includes(activity)) {
      const cardContent = card.querySelector('.hs-card-content');
      if (cardContent) {
        const activityNote = document.createElement('div');
        activityNote.className = 'hs-activity-connection';
        activityNote.innerHTML = `
          <h4>Perfect Match with Your Activities</h4>
          <p><strong>${ctx.childName}'s ${activity.replace('_', ' ')} experience</strong> provides excellent foundation for ${connection}</p>
        `;
        cardContent.appendChild(activityNote);
      }
    }
  };

  // Apply activity connections
  addActivityConnection('english', 'drama', 'understanding character development and literary analysis through performance experience.');
  addActivityConnection('history', 'debate', 'developing the argumentation and evidence evaluation skills essential for historical analysis.');
  addActivityConnection('geography', 'duke_of_edinburgh', 'applying geographical knowledge through practical fieldwork and environmental awareness.');
  addActivityConnection('politics', 'student_council', 'understanding democratic processes and governance through practical leadership experience.');
  addActivityConnection('psychology', 'peer_mentoring', 'applying understanding of human behavior and development in supporting others.');

  // Collapsible sections functionality
  $$('.hs-section-title', root).forEach(title => {
    title.addEventListener('click', function() {
      const section = this.parentElement;
      section.classList.toggle('collapsed');
    });
  });

  // Smooth scrolling for navigation
  $$('.hs-nav-btn:not([data-filter="all"])', root).forEach(btn => {
    btn.addEventListener('click', () => {
      const subject = btn.getAttribute('data-filter');
      const targetCard = $(`.hs-card[data-subject="${subject}"]`, root);
      if (targetCard) {
        setTimeout(() => {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    });
  });

  // Update statistics based on personalization
  const updateStats = () => {
    if (ctx.universityAspirations === 'Oxbridge') {
      const requirementsStat = $('.hs-stat-number', root);
      if (requirementsStat && requirementsStat.textContent === 'A*AA') {
        const label = requirementsStat.nextElementSibling;
        if (label) {
          label.textContent = 'Oxbridge Requirements (A*A*A + EPQ)';
        }
      }
    }
  };
  
  updateStats();

  // Enhanced welcome card personalization
  const enhanceWelcomeCard = () => {
    const welcomeCard = $('.hs-welcome-card', root);
    if (welcomeCard && ctx.academicInterests?.includes('humanities')) {
      const existingText = welcomeCard.querySelector('.hs-welcome-text');
      if (existingText) {
        existingText.innerHTML = `
          Discover how our humanities and social sciences programmes will develop your critical thinking and prepare you for university success.<br>
          <small style="opacity: 0.8; margin-top: 10px; display: block;">
            ${ctx.universityAspirations === 'Oxbridge' ? 'Specially designed to meet Oxbridge entry requirements' : 'Proven track record of university success'}
          </small>
        `;
      }
    }
  };
  
  enhanceWelcomeCard();

  // Initialize with all subjects visible
  console.log('Humanities & Social Sciences module initialized with personalization for:', ctx.childName);
};
// Add this to your app.js MODULES object
MODULES['languages_classics'] = (root, ctx) => {
  // 1. Update name placeholders
  function updateNames() {
    const childName = ctx.childName || '[Child\'s Name]';
    
    // Update all child name placeholders
    root.querySelectorAll('.child-name').forEach(element => {
      element.textContent = childName;
    });
  }

  // 2. Add personalized header content
  function addPersonalizedHeader() {
    const personalizedIntro = root.querySelector('#personalized-intro');
    const introTitle = root.querySelector('#intro-title');
    const introContent = root.querySelector('#intro-content');
    
    if (ctx.childName && ctx.childName !== '[Child\'s Name]') {
      personalizedIntro.style.display = 'block';
      
      // Customize based on academic interests
      if (ctx.academicInterests?.includes('languages')) {
        introTitle.innerHTML = `Perfect for ${ctx.childName} - Language Enthusiast`;
        introContent.innerHTML = `With your passion for languages, ${ctx.childName} will thrive in our comprehensive language programmes. From modern European languages to classical studies, these subjects align perfectly with your academic interests and offer excellent preparation for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge applications' : 'university success'}.`;
      } else if (ctx.academicInterests?.includes('classics')) {
        introTitle.innerHTML = `Perfect for ${ctx.childName} - Classical Scholar`;
        introContent.innerHTML = `Your interest in classics makes these subjects ideal for ${ctx.childName}. Our world-class Classical Studies department, with six specialist teachers in historic settings, offers unparalleled preparation for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxford and Cambridge' : 'top universities'}.`;
      } else if (ctx.academicInterests?.includes('humanities')) {
        introTitle.innerHTML = `Excellent Choice for ${ctx.childName}`;
        introContent.innerHTML = `Languages and Classical Studies complement humanities beautifully, developing critical thinking, cultural awareness, and communication skills. These subjects provide excellent preparation for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'competitive university applications' : 'university success'}.`;
      } else {
        introTitle.innerHTML = `Discover New Horizons for ${ctx.childName}`;
        introContent.innerHTML = `Even without prior language experience, ${ctx.childName} could discover a passion for global communication and cultural understanding through our exceptional language and classics programmes.`;
      }
    }
  }

  // 3. Prioritize and reorder subjects
  function prioritizeSubjects() {
    const container = root.querySelector('#subjects-container');
    const subjectCards = Array.from(container.children);
    
    // Create priority scoring system
    const getSubjectPriority = (card) => {
      let score = 0;
      const subject = card.getAttribute('data-subject');
      
      // Academic interest matches
      if (ctx.academicInterests?.includes('languages') && 
          ['french', 'german', 'spanish'].includes(subject)) {
        score += 30;
        card.classList.add('priority-match');
      }
      
      if (ctx.academicInterests?.includes('classics') && 
          ['latin', 'greek', 'classical-civilisation'].includes(subject)) {
        score += 30;
        card.classList.add('priority-match');
      }
      
      // University aspiration bonuses
      if (ctx.universityAspirations === 'Oxford or Cambridge') {
        if (['latin', 'greek', 'classical-civilisation'].includes(subject)) {
          score += 15;
        }
        if (['french', 'german', 'spanish'].includes(subject)) {
          score += 10;
        }
      }
      
      // Activity matches (leadership = languages for global communication)
      if (ctx.activities?.includes('leadership') && 
          ['french', 'german', 'spanish'].includes(subject)) {
        score += 10;
      }
      
      // EAL for international students
      if (ctx.stage === 'Sixth Form' && subject === 'eal') {
        score += 5;
      }
      
      return score;
    };
    
    // Sort by priority score
    subjectCards.sort((a, b) => getSubjectPriority(b) - getSubjectPriority(a));
    
    // Reorder in DOM
    subjectCards.forEach(card => container.appendChild(card));
  }

  // 4. Add personalized content to each subject
  function addPersonalizedSubjectContent() {
    const childName = ctx.childName || '[Child\'s Name]';
    
    // French personalization
    const frenchContent = root.querySelector('#french-personalized-content');
    if (frenchContent && (ctx.academicInterests?.includes('languages') || ctx.activities?.includes('leadership'))) {
      frenchContent.innerHTML = `
        <div class="lc-high-priority">
          <h4>Perfect Match for ${childName}</h4>
          <p><strong>Language Leadership:</strong> ${childName}'s interest in ${ctx.activities?.includes('leadership') ? 'leadership and ' : ''}languages makes French ideal for developing global communication skills essential for international careers and ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge preparation' : 'university success'}.</p>
          <p><strong>Cultural Engagement:</strong> Individual Research Projects allow ${childName} to explore personal interests while developing advanced presentation skills valued by top universities.</p>
        </div>
      `;
    }
    
    // German personalization
    const germanContent = root.querySelector('#german-personalized-content');
    if (germanContent && (ctx.academicInterests?.includes('languages') || (ctx.priorities?.academic >= 3))) {
      germanContent.innerHTML = `
        <div class="lc-university-focus">
          <h4>Academic Excellence for ${childName}</h4>
          <p><strong>Rigorous Academic Approach:</strong> German's systematic grammatical structure appeals to analytical minds and develops precision in thinking - excellent preparation for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxford and Cambridge applications' : 'competitive university courses'}.</p>
          ${ctx.activities?.includes('leadership') ? `<p><strong>Leadership Skills:</strong> Cultural understanding and communication skills developed through German study enhance ${childName}'s leadership potential in international contexts.</p>` : ''}
        </div>
      `;
    }
    
    // Spanish personalization
    const spanishContent = root.querySelector('#spanish-personalized-content');
    if (spanishContent && (ctx.academicInterests?.includes('languages') || ctx.activities?.includes('community'))) {
      spanishContent.innerHTML = `
        <div class="lc-activity-match">
          <h4>Global Perspective for ${childName}</h4>
          <p><strong>World's Second Language:</strong> Spanish opens doors to global communication with over 500 million speakers worldwide - perfect for ${childName}'s international aspirations and ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'competitive university applications' : 'future career success'}.</p>
          ${ctx.activities?.includes('community') ? `<p><strong>Community Engagement:</strong> Understanding Hispanic cultures enhances ${childName}'s community service perspective and cultural sensitivity.</p>` : ''}
        </div>
      `;
    }
    
    // Latin personalization  
    const latinContent = root.querySelector('#latin-personalized-content');
    if (latinContent && (ctx.academicInterests?.includes('classics') || ctx.universityAspirations === 'Oxford or Cambridge')) {
      latinContent.innerHTML = `
        <div class="lc-high-priority">
          <h4>Classical Excellence for ${childName}</h4>
          <p><strong>Oxbridge Preparation:</strong> Latin develops linguistic precision, analytical thinking, and cultural literacy highly valued by ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxford and Cambridge' : 'top universities'}. Recent graduates have achieved places at both universities.</p>
          <p><strong>Foundation Skills:</strong> The logical structure of Latin enhances ${childName}'s analytical abilities and provides excellent preparation for law, medicine, and academic careers.</p>
        </div>
      `;
    }
    
    // Greek personalization
    const greekContent = root.querySelector('#greek-personalized-content');
    if (greekContent && (ctx.academicInterests?.includes('classics') || (ctx.priorities?.academic >= 3))) {
      greekContent.innerHTML = `
        <div class="lc-university-focus">
          <h4>Philosophical Foundations for ${childName}</h4>
          <p><strong>Academic Distinction:</strong> Classical Greek provides access to original philosophical and literary works, developing sophisticated analytical skills perfect for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge applications' : 'competitive academic programmes'}.</p>
          <p><strong>Unique Advantage:</strong> Few students study Greek, making ${childName} stand out in university applications with this distinctive subject combination.</p>
        </div>
      `;
    }
    
    // Classical Civilisation personalization
    const classicalCivContent = root.querySelector('#classical-civ-personalized-content');
    if (classicalCivContent && (ctx.academicInterests?.includes('classics') || ctx.academicInterests?.includes('humanities'))) {
      classicalCivContent.innerHTML = `
        <div class="lc-priority-highlight">
          <h4>Humanities Excellence for ${childName}</h4>
          <p><strong>Perfect Subject Combination:</strong> Classical Civilisation complements ${ctx.academicInterests?.includes('humanities') ? 'humanities interests' : 'academic studies'} beautifully, requiring no prior knowledge but developing sophisticated analytical and essay-writing skills.</p>
          <p><strong>University Success:</strong> 83% of recent leavers achieved Russell Group places, with excellent preparation for ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'Oxbridge applications in Classics, History, or related fields' : 'diverse university courses'}.</p>
        </div>
      `;
    }
    
    // EAL personalization (if international context suggested)
    const ealContent = root.querySelector('#eal-personalized-content');
    if (ealContent && ctx.stage === 'Sixth Form') {
      ealContent.innerHTML = `
        <div class="lc-age-appropriate">
          <h4>University Preparation for ${childName}</h4>
          <p><strong>Academic English Excellence:</strong> EAL support ensures ${childName} develops university-level English skills essential for success in A Level subjects and ${ctx.universityAspirations === 'Oxford or Cambridge' ? 'competitive university applications' : 'higher education'}.</p>
          <p><strong>Integrated Support:</strong> Individual tuition available to help ${childName} excel across all chosen subjects while building confidence in academic English.</p>
        </div>
      `;
    }
  }

  // 5. Update navigation highlighting  
  function updateNavigation() {
    const navButtons = root.querySelectorAll('.lc-nav-btn');
    
    navButtons.forEach(button => {
      const filter = button.getAttribute('data-filter');
      
      // Highlight based on academic interests
      if (ctx.academicInterests?.includes('languages') && 
          ['french', 'german', 'spanish'].includes(filter)) {
        button.classList.add('priority-match');
      }
      
      if (ctx.academicInterests?.includes('classics') && 
          ['latin', 'greek', 'classical-civilisation'].includes(filter)) {
        button.classList.add('priority-match');
      }
    });
    
    // Update nav title
    const navTitle = root.querySelector('#nav-title');
    if (navTitle && (ctx.academicInterests?.includes('languages') || ctx.academicInterests?.includes('classics'))) {
      navTitle.textContent = `${ctx.childName}'s Language & Classics Options`;
    }
  }

  // 6. Add university-focused content
  function addUniversityFocus() {
    const universityTitle = root.querySelector('#university-success-title');
    const globalSkillsContent = root.querySelector('#global-skills-content');
    
    if (universityTitle && globalSkillsContent) {
      if (ctx.universityAspirations === 'Oxford or Cambridge') {
        universityTitle.textContent = `Oxbridge Success & Global Opportunities for ${ctx.childName}`;
        globalSkillsContent.innerHTML = `Languages and classics provide exceptional preparation for Oxford and Cambridge applications. ${ctx.childName} will develop the analytical thinking, cultural knowledge, and communication skills that admissions tutors value highly. Recent students have achieved places at both universities across diverse subjects.`;
      } else if (ctx.universityAspirations === 'Russell Group') {
        universityTitle.textContent = `Russell Group Success & Professional Excellence for ${ctx.childName}`;
        globalSkillsContent.innerHTML = `With 83% of classics students achieving Russell Group places, ${ctx.childName} will be excellently prepared for top university applications. Language competence and classical knowledge provide valuable differentiation in competitive admissions processes.`;
      }
    }
  }

  // 7. Add boarding-specific content
  function addBoardingContent() {
    if (ctx.boardingPreference === 'boarding' || ctx.boardingPreference === 'Full Boarding') {
      // Add boarding-specific language opportunities
      const subjects = ['french', 'german', 'spanish', 'latin', 'greek', 'classical-civilisation'];
      
      subjects.forEach(subject => {
        const content = root.querySelector(`#${subject}-personalized-content`);
        if (content && !content.innerHTML.includes('boarding')) {
          const boardingContent = `
            <div class="lc-boarding-highlight">
              <h4>Boarding Life Enhancement for ${ctx.childName}</h4>
              <p><strong>Immersive Learning:</strong> Boarding students benefit from Modern Languages Society events, Classical Society gatherings, and peer study groups. ${ctx.childName} will engage with international students, enhancing cultural understanding and language practice opportunities.</p>
            </div>
          `;
          content.innerHTML += boardingContent;
        }
      });
    }
  }

  // 8. Update CTA section
  function updateCTASection() {
    const ctaTitle = root.querySelector('#cta-title');
    const ctaSubtitle = root.querySelector('#cta-subtitle');
    const childName = ctx.childName || '[Child\'s Name]';
    
    if (ctaTitle && ctaSubtitle) {
      if (ctx.academicInterests?.includes('languages') || ctx.academicInterests?.includes('classics')) {
        ctaTitle.textContent = `Experience Language Excellence with ${childName}`;
        ctaSubtitle.innerHTML = `Book your personalised visit and discover how ${childName} will thrive in our world-class language and classics programmes. See our facilities, meet our teachers, and explore the opportunities that await.`;
      } else {
        ctaTitle.textContent = `Discover Global Opportunities for ${childName}`;
        ctaSubtitle.innerHTML = `Book your personalised visit and see how languages and classics could open new horizons for ${childName}. Explore our exceptional facilities and meet our passionate teachers.`;
      }
    }
  }

  // 9. Subject filtering functionality
  function setupSubjectFiltering() {
    const navButtons = root.querySelectorAll('.lc-nav-btn');
    const subjectCards = root.querySelectorAll('.lc-subject-card');

    navButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active button
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const filter = button.getAttribute('data-filter');

        // Filter subject cards
        subjectCards.forEach(card => {
          if (filter === 'all' || card.getAttribute('data-subject') === filter) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  // 10. Collapsible sections functionality
  function setupCollapsibleSections() {
    const sectionTitles = root.querySelectorAll('.lc-section-title');
    
    sectionTitles.forEach(title => {
      title.addEventListener('click', () => {
        const section = title.parentElement;
        section.classList.toggle('collapsed');
      });
    });
  }

  // 11. Interactive stats
  function setupInteractiveStats() {
    const stats = root.querySelectorAll('.lc-stat');
    stats.forEach(stat => {
      stat.addEventListener('mouseenter', () => {
        stat.style.transform = 'translateY(-5px) scale(1.05)';
      });
      
      stat.addEventListener('mouseleave', () => {
        stat.style.transform = 'translateY(0) scale(1)';
      });
    });
  }

  // Initialize all personalization
  updateNames();
  addPersonalizedHeader();
  prioritizeSubjects();
  addPersonalizedSubjectContent();
  updateNavigation();
  addUniversityFocus();
  addBoardingContent();
  updateCTASection();
  setupSubjectFiltering();
  setupCollapsibleSections();
  setupInteractiveStats();
  
  // Lazy load images
  if (typeof hydrateLazyAssets === 'function') {
    hydrateLazyAssets(root);
  }
};
MODULES['final_hero'] = (root, ctx) => {
  // Update child names
  $$('.child-name', root).forEach(el => el.textContent = ctx.childName || '[Child\'s Name]');
  
  // Hydrate assets
  hydrateLazyAssets(root);
  
  // Personal vision - INSPIRING UNIVERSAL MESSAGE
  const visionEls = $$('.fh-personal-vision', root);
  if (visionEls.length > 0) {
    let vision = '';
    
    if (ctx.activities?.includes('leadership') && ctx.priorities?.activities === 3) {
      if (ctx.universityAspirations === 'Oxford or Cambridge' || ctx.universityAspirations === 'Oxbridge') {
        vision = `Here, extraordinary journeys begin. Where curiosity becomes discovery, potential becomes achievement, and every student finds their unique path to a remarkable future.`;
      } else {
        vision = `Here, extraordinary journeys begin. Where curiosity becomes discovery, potential becomes achievement, and every student finds their unique path to a remarkable future.`;
      }
    } else if (ctx.priorities?.academic === 3) {
      if (ctx.academicInterests?.includes('sciences')) {
        vision = `Here, extraordinary journeys begin. Where curiosity becomes discovery, potential becomes achievement, and every student finds their unique path to a remarkable future.`;
      } else if (ctx.academicInterests?.includes('mathematics')) {
        vision = `Here, extraordinary journeys begin. Where curiosity becomes discovery, potential becomes achievement, and every student finds their unique path to a remarkable future.`;
      } else {
        vision = `Here, extraordinary journeys begin. Where curiosity becomes discovery, potential becomes achievement, and every student finds their unique path to a remarkable future.`;
      }
    } else if (ctx.activities?.includes('sports') && ctx.priorities?.sports >= 2) {
      vision = `Here, extraordinary journeys begin. Where curiosity becomes discovery, potential becomes achievement, and every student finds their unique path to a remarkable future.`;
    } else if (ctx.activities?.includes('music') || ctx.activities?.includes('drama')) {
      vision = `Here, extraordinary journeys begin. Where curiosity becomes discovery, potential becomes achievement, and every student finds their unique path to a remarkable future.`;
    } else if (ctx.boardingPreference === 'Full Boarding' || ctx.boardingPreference === 'boarding') {
      vision = `Here, extraordinary journeys begin. Where curiosity becomes discovery, potential becomes achievement, and every student finds their unique path to a remarkable future.`;
    } else {
      vision = `Here, extraordinary journeys begin. Where curiosity becomes discovery, potential becomes achievement, and every student finds their unique path to a remarkable future.`;
    }
    
    visionEls.forEach(el => el.textContent = vision);
  }
  
  // Personal conclusion - FULL PERSONALIZATION
  const conclusionEl = $('.fh-personal-conclusion', root);
  if (conclusionEl) {
    let conclusion = '';
    
    if (ctx.values?.includes('character-building') && ctx.priorities?.pastoral === 3) {
      conclusion = `The video you've just watched showcases a year in the life of our College - every triumph, every discovery, every moment of growth that awaits ${ctx.childName}. Character is built not in a moment, but in a thousand small choices, challenges overcome, and opportunities seized. At Cheltenham College, ${ctx.childName} won't just receive an education - ${ctx.gender === 'male' ? 'he' : 'she'} will become the person ${ctx.gender === 'male' ? 'he is' : 'she is'} meant to be.`;
    } else if (ctx.universityAspirations === 'Oxford or Cambridge' || ctx.universityAspirations === 'Oxbridge') {
      conclusion = `Every opportunity shown in this video will strengthen ${ctx.childName}'s university applications and prepare ${ctx.gender === 'male' ? 'him' : 'her'} for success at the world's finest institutions. The path to Oxbridge begins here.`;
    } else if (ctx.activities?.includes('leadership')) {
      conclusion = `In this video, you've seen our pupils leading, inspiring, and achieving. Next year, that could be ${ctx.childName} - captaining teams, organizing events, mentoring younger pupils.`;
    } else if (ctx.priorities?.academic === 3) {
      conclusion = `Every academic achievement celebrated in this video represents hours of dedication and inspired teaching. ${ctx.childName} will join this tradition of excellence.`;
    } else {
      conclusion = `This video captures what makes Cheltenham College extraordinary. For ${ctx.childName}, this represents not just the next chapter, but the beginning of a remarkable journey.`;
    }
    
    conclusionEl.textContent = conclusion;
  }
  
  // Customize tagline
  const taglineEl = $('.fh-personal-tagline', root);
  if (taglineEl) {
    if ((ctx.universityAspirations === 'Oxford or Cambridge' || ctx.universityAspirations === 'Oxbridge') && ctx.priorities?.academic === 3) {
      taglineEl.textContent = 'Where Oxbridge dreams take flight and academic excellence knows no bounds';
    } else if (ctx.activities?.includes('leadership') && ctx.priorities?.activities === 3) {
      taglineEl.textContent = 'Where tomorrow\'s leaders discover their voice and learn to inspire others';
    } else if (ctx.boardingPreference === 'Full Boarding' || ctx.boardingPreference === 'boarding') {
      taglineEl.textContent = 'Where boarding life creates bonds that last forever and memories that define you';
    }
  }
  
  // VIDEO LOADING - Only when module enters view
  const video = $('.fh-hero-video', root);
  if (video) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        console.log('Final Hero module entered view - starting video');
        
        // Start the video when the module comes into view
        video.play().catch(e => console.log('Video play failed:', e));
        
        observer.unobserve(root);
        
        // Setup sound control for video element
        setupSoundControl();
        
        // Text timer - 20 seconds after video starts
        setTimeout(() => {
          const overlay = $('.fh-overlay-content', root);
          const below = $('.fh-text-below-video', root);
          if (overlay && below) {
            overlay.style.opacity = '0';
            below.classList.add('visible');
            console.log('Final Hero: Text moved down after 20 seconds');
          }
        }, 20000);
      }
    }, { 
      threshold: 0.1, // Less aggressive - starts when 10% visible
      rootMargin: '50px 0px 0px 0px'  // Start earlier
    });
    
    observer.observe(root);
  }
  
  function setupSoundControl() {
    const video = root.querySelector('.fh-hero-video');
    const audioToggle = root.querySelector('#audioToggle');
    
    if (audioToggle && video) {
      audioToggle.addEventListener('click', () => {
        if (video.muted) {
          video.muted = false;
          audioToggle.textContent = '🔇 Sound';
        } else {
          video.muted = true;
          audioToggle.textContent = '🔊 Sound';
        }
      });
    }
  }
  
  console.log('Final Hero module initialized for:', ctx.childName);
};
