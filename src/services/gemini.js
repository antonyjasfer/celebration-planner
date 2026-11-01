/**
 * Gemini AI Service for CelebriPlan
 *
 * Handles all communication with Google Gemini API.
 * Provides structured prompts for event planning, budget analysis,
 * timeline generation, vendor coordination, and personalized ideas.
 * Includes graceful intelligent fallback logic so the application
 * remains completely interactive even without an active key or during rate limits.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiRateLimiter } from '../utils/rateLimiter.js';

/** Validates and retrieves the API key from multiple potential sources */
export function getApiKey() {
  const key =
    (typeof localStorage !== 'undefined' && localStorage.getItem('gemini_api_key')) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gemini_api_key')) ||
    (typeof window !== 'undefined' && window.__GEMINI_API_KEY__) ||
    import.meta.env.VITE_GEMINI_API_KEY;

  if (!key || key === 'your_gemini_api_key_here') {
    return null;
  }
  return key;
}

export function isApiKeyConfigured() {
  const key = getApiKey();
  return Boolean(key && key !== 'your_gemini_api_key_here');
}

/** Singleton Gemini client — lazily initialized */
let genAI = null;
let model = null;

function getModel() {
  const key = getApiKey();
  if (!key) {
    return null;
  }
  if (!geminiRateLimiter.canMakeRequest()) {
    console.warn('Client-side rate limit reached for Gemini API. Using fallback engine.');
    return null;
  }
  if (!model) {
    genAI = new GoogleGenerativeAI(key);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });
  }
  geminiRateLimiter.recordRequest();
  return model;
}

/**
 * System prompt that defines CelebriPlan's AI persona and behavior.
 */
const SYSTEM_PROMPT = `You are CelebriPlan AI — a warm, elite, and detail-oriented event planning assistant.

CORE PRINCIPLES:
1. PERSONALIZE: Always tailor suggestions to the user's specific budget, guest count, preferences, and cultural context.
2. BE HONEST: Never invent unrealistic prices. Use phrases like "estimated cost", "typical range", "verify with local vendors".
3. THINK IN TRADEOFFS: When budget is tight, help users understand what they gain and lose with each decision.
4. BE PRACTICAL: Give actionable steps, clear milestones, and realistic timelines.
5. RESPECT PRIORITIES: Ask what matters most to the user and optimize around those priorities.

INDIAN CONTEXT AWARENESS:
- Understand Indian wedding customs (mehendi, sangeet, haldi, pheras, reception)
- Know typical Indian event budgets (lakhs denomination)
- Suggest Indian caterers, decorators, and venue types when relevant
- Be aware of regional variations (North/South Indian, Marathi, Bengali, Gujarati, etc.)

Always respond in valid JSON when requested, and in warm, concise conversational markdown when discussing.`;

/** Helper to clean and extract JSON from markdown output */
function extractJSON(text) {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    const candidate = jsonMatch[1].trim();
    return JSON.parse(candidate);
  } catch (err) {
    // Attempt relaxed parsing if standard match fails
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    throw err;
  }
}

/**
 * Sends a message to Gemini with the event planning context.
 */
export async function sendMessage(userMessage, eventContext = {}) {
  const aiModel = getModel();
  if (aiModel) {
    try {
      const contextString = Object.keys(eventContext).length > 0
        ? `\n\nCURRENT EVENT CONTEXT:\n${JSON.stringify(eventContext, null, 2)}`
        : '';
      const prompt = `${SYSTEM_PROMPT}${contextString}\n\nUser: ${userMessage}`;
      const result = await aiModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.warn('Gemini API call failed, using intelligent fallback response:', error);
    }
  }

  // Fallback response generator
  return getFallbackChatResponse(userMessage, eventContext);
}

/**
 * Generates a comprehensive budget breakdown for an event.
 */
export async function generateBudgetBreakdown(params) {
  const { eventType, budget, guestCount, priorities, additionalNotes = '' } = params;
  const aiModel = getModel();

  if (aiModel) {
    try {
      const prompt = `${SYSTEM_PROMPT}

Generate a detailed budget breakdown for the following event. Return ONLY valid JSON.

EVENT DETAILS:
- Type: ${eventType}
- Total Budget: ₹${budget.toLocaleString('en-IN')}
- Guest Count: ${guestCount}
- Priorities: ${priorities}
- Notes: ${additionalNotes}

Return this JSON structure:
{
  "totalBudget": ${budget},
  "categories": [
    {
      "name": "Category Name",
      "allocated": <amount in INR>,
      "percentage": <percentage of total>,
      "priority": "high" | "medium" | "low",
      "breakdown": [
        { "item": "Sub-item name", "estimated": <amount>, "notes": "brief note" }
      ],
      "savingTips": ["tip 1", "tip 2"]
    }
  ],
  "contingency": <suggested contingency amount>,
  "warnings": ["any budget warnings or risks"],
  "suggestions": ["personalized suggestions based on priorities"]
}

Ensure all category amounts plus contingency sum to total budget.`;

      const result = await aiModel.generateContent(prompt);
      return extractJSON(result.response.text());
    } catch (error) {
      console.warn('Gemini budget generation failed, falling back to smart budget model:', error);
    }
  }

  return getFallbackBudget(params);
}

/**
 * Generates a timeline of tasks for event planning.
 */
export async function generateTimeline(params) {
  const { eventType, eventDate, budget, guestCount, currentPhase = 'just starting' } = params;
  const today = new Date().toISOString().split('T')[0];
  const aiModel = getModel();

  if (aiModel) {
    try {
      const prompt = `${SYSTEM_PROMPT}

Create a detailed event planning timeline. Return ONLY valid JSON.

EVENT DETAILS:
- Type: ${eventType}
- Event Date: ${eventDate}
- Today's Date: ${today}
- Budget: ₹${budget.toLocaleString('en-IN')}
- Guest Count: ${guestCount}
- Current Phase: ${currentPhase}

Return this JSON structure:
{
  "eventDate": "${eventDate}",
  "totalDaysRemaining": <number>,
  "phases": [
    {
      "name": "Phase Name",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "status": "upcoming" | "current" | "completed",
      "tasks": [
        {
          "id": "task-1",
          "title": "Task title",
          "description": "Brief description",
          "deadline": "YYYY-MM-DD",
          "priority": "critical" | "high" | "medium" | "low",
          "category": "venue" | "catering" | "decoration" | "photography" | "guest" | "other",
          "dependsOn": ["task-id if depends on another task"],
          "estimatedCost": <cost if applicable>,
          "completed": false
        }
      ]
    }
  ],
  "milestones": [
    { "title": "Milestone", "date": "YYYY-MM-DD", "description": "Why this matters" }
  ],
  "urgentActions": ["things to do immediately"]
}`;

      const result = await aiModel.generateContent(prompt);
      return extractJSON(result.response.text());
    } catch (error) {
      console.warn('Gemini timeline generation failed, falling back to smart timeline model:', error);
    }
  }

  return getFallbackTimeline(params);
}

/**
 * Generates a vendor checklist with questions and comparison criteria.
 */
export async function generateVendorChecklist(params) {
  const { eventType, budget, guestCount, vendorCategories = [] } = params;
  const categories = vendorCategories.length > 0
    ? vendorCategories.join(', ')
    : 'venue, catering, decoration, photography, sound & entertainment';
  const aiModel = getModel();

  if (aiModel) {
    try {
      const prompt = `${SYSTEM_PROMPT}

Create a vendor coordination checklist. Return ONLY valid JSON.

EVENT DETAILS:
- Type: ${eventType}
- Budget: ₹${budget.toLocaleString('en-IN')}
- Guest Count: ${guestCount}
- Vendor Categories Needed: ${categories}

Return this JSON structure:
{
  "vendors": [
    {
      "category": "Vendor Category",
      "budgetRange": { "min": <amount>, "max": <amount> },
      "priority": "essential" | "recommended" | "optional",
      "questionsToAsk": ["Question 1", "Question 2"],
      "redFlags": ["Warning sign 1"],
      "comparisonCriteria": ["Criterion 1", "Criterion 2"],
      "bookingTimeline": "When to book relative to event date",
      "tips": ["Helpful tip"]
    }
  ],
  "generalTips": ["Overall vendor management tips"],
  "negotiationTips": ["How to negotiate with vendors"],
  "contractChecklist": ["What to check in vendor contracts"]
}`;

      const result = await aiModel.generateContent(prompt);
      return extractJSON(result.response.text());
    } catch (error) {
      console.warn('Gemini vendor checklist failed, falling back to smart vendor model:', error);
    }
  }

  return getFallbackVendorChecklist(params);
}

/**
 * Generates personalized event ideas and themes.
 */
export async function generatePersonalizedIdeas(params) {
  const {
    eventType,
    budget,
    guestCount,
    preferences = '',
    ageGroup = 'mixed',
    culturalContext = ''
  } = params;
  const aiModel = getModel();

  if (aiModel) {
    try {
      const prompt = `${SYSTEM_PROMPT}

Generate personalized event ideas and themes. Return ONLY valid JSON.

EVENT DETAILS:
- Type: ${eventType}
- Budget: ₹${budget.toLocaleString('en-IN')}
- Guest Count: ${guestCount}
- Desired Atmosphere: ${preferences}
- Age Group: ${ageGroup}
- Cultural Context: ${culturalContext}

Return this JSON structure:
{
  "themes": [
    {
      "name": "Theme Name",
      "description": "Brief description",
      "estimatedCost": <amount>,
      "suitability": "Why this fits the user's needs",
      "elements": {
        "decoration": ["Decoration ideas"],
        "food": ["Menu suggestions"],
        "activities": ["Activity ideas"],
        "music": ["Music/entertainment ideas"]
      },
      "pros": ["Advantage 1"],
      "cons": ["Limitation 1"]
    }
  ],
  "foodSuggestions": [
    {
      "type": "Menu Type",
      "items": ["Item 1", "Item 2"],
      "estimatedCostPerPerson": <amount>,
      "dietaryOptions": ["Veg", "Non-veg", "Vegan"]
    }
  ],
  "entertainmentIdeas": [
    { "idea": "Entertainment idea", "cost": <amount>, "suitableFor": "Who it's best for" }
  ],
  "personalTouches": ["Unique personalization ideas"],
  "budgetFriendlyAlternatives": ["Cost-saving alternatives that don't compromise quality"]
}`;

      const result = await aiModel.generateContent(prompt);
      return extractJSON(result.response.text());
    } catch (error) {
      console.warn('Gemini ideas generation failed, falling back to smart ideas model:', error);
    }
  }

  return getFallbackIdeas(params);
}

/**
 * Analyzes the impact of a change on the existing plan.
 * This powers the Adaptive Replanning engine.
 */
export async function analyzeChangeImpact(params) {
  const { currentPlan, changeDescription, changeType } = params;
  const aiModel = getModel();

  if (aiModel) {
    try {
      const prompt = `${SYSTEM_PROMPT}

A user is making changes to their event plan. Analyze the impact and suggest how to adapt. Return ONLY valid JSON.

CURRENT PLAN:
${JSON.stringify(currentPlan, null, 2)}

CHANGE:
- Type: ${changeType}
- Description: ${changeDescription}

Return this JSON structure:
{
  "impactSummary": "Brief summary of how this change affects the overall plan",
  "affectedAreas": [
    {
      "area": "What's affected",
      "impact": "high" | "medium" | "low",
      "description": "How it's affected",
      "recommendation": "What to do about it"
    }
  ],
  "revisedBudget": {
    "original": <original total>,
    "revised": <new total>,
    "difference": <difference>,
    "adjustments": [
      { "category": "Category", "original": <amount>, "revised": <amount>, "reason": "Why" }
    ]
  },
  "tradeoffs": [
    { "option": "Option description", "pros": ["Pro"], "cons": ["Con"], "savings": <amount if applicable> }
  ],
  "nextSteps": ["Immediate action items based on this change"],
  "risks": ["Potential risks from this change"]
}`;

      const result = await aiModel.generateContent(prompt);
      return extractJSON(result.response.text());
    } catch (error) {
      console.warn('Gemini adaptive analysis failed, falling back to smart replanner:', error);
    }
  }

  return getFallbackChangeImpact(params);
}

/**
 * Chat-based interaction for ongoing planning conversations.
 */
export async function chat(messages, eventContext = {}) {
  const aiModel = getModel();

  if (aiModel) {
    try {
      const contextString = Object.keys(eventContext).length > 0
        ? `\n\nCURRENT EVENT CONTEXT:\n${JSON.stringify(eventContext, null, 2)}`
        : '';

      const conversationHistory = messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'CelebriPlan AI'}: ${msg.content}`)
        .join('\n\n');

      const prompt = `${SYSTEM_PROMPT}${contextString}\n\nCONVERSATION:\n${conversationHistory}\n\nCelebriPlan AI:`;
      const result = await aiModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.warn('Gemini chat failed, using fallback chat model:', error);
    }
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  return getFallbackChatResponse(lastUserMsg, eventContext);
}

/* =======================================================================
   Intelligent Fallback Generators (High-fidelity Indian Event Models)
   ======================================================================= */

function getFallbackBudget({ eventType, budget, guestCount, priorities = '' }) {
  const b = Number(budget) || 200000;
  const isWedding = eventType === 'wedding';
  const isBirthday = eventType === 'birthday';

  const contingency = Math.round(b * 0.05);
  const allocable = b - contingency;

  let categories = [];

  if (isWedding) {
    categories = [
      {
        name: 'Venue & Accommodation',
        allocated: Math.round(allocable * 0.35),
        percentage: 35,
        priority: 'high',
        breakdown: [
          { item: 'Banquet Hall / Resort Rental', estimated: Math.round(allocable * 0.25), notes: '2 days booking with bridal suite' },
          { item: 'Guest Rooms / Lodging', estimated: Math.round(allocable * 0.10), notes: 'Accommodations for close family' },
        ],
        savingTips: ['Inquire about weekday or off-muhurat discounts', 'Book venue package that includes chairs, stage, and basic lighting']
      },
      {
        name: 'Catering & Beverages',
        allocated: Math.round(allocable * 0.28),
        percentage: 28,
        priority: 'high',
        breakdown: [
          { item: 'Main Wedding Buffet & Live Counters', estimated: Math.round(allocable * 0.20), notes: `Target ~₹${Math.round((allocable * 0.20) / Math.max(guestCount, 50))} per plate` },
          { item: 'High-Tea, Welcome Drinks & Mocktails', estimated: Math.round(allocable * 0.08), notes: 'Chaat counters and seasonal coolers' },
        ],
        savingTips: ['Limit dessert options to 3 high-impact signatures rather than 8', 'Streamline appetizers to 4 crowd-pleasers']
      },
      {
        name: 'Decor & Theme Styling',
        allocated: Math.round(allocable * 0.15),
        percentage: 15,
        priority: 'medium',
        breakdown: [
          { item: 'Mandap / Stage & Floral Installations', estimated: Math.round(allocable * 0.10), notes: 'Fresh seasonal florals & brass elements' },
          { item: 'Entrance Arch & Photo-Op Corner', estimated: Math.round(allocable * 0.05), notes: 'Fairylights and customized signage' },
        ],
        savingTips: ['Use marigolds and local tuberose instead of imported lilies', 'Repurpose mehendi floral arrangements for the reception stage']
      },
      {
        name: 'Photography & Cinematography',
        allocated: Math.round(allocable * 0.10),
        percentage: 10,
        priority: 'high',
        breakdown: [
          { item: 'Candid Photography & Traditional Video', estimated: Math.round(allocable * 0.07), notes: 'Covering rituals and couple portraits' },
          { item: 'Teaser Reel & Drone Coverage', estimated: Math.round(allocable * 0.03), notes: 'Same-day edit for social sharing' },
        ],
        savingTips: ['Book pre-wedding shoot and wedding day as a single combined package', 'Inquire if digital-first albums reduce initial package cost']
      },
      {
        name: 'Attire, Makeup & Hair',
        allocated: Math.round(allocable * 0.07),
        percentage: 7,
        priority: 'medium',
        breakdown: [
          { item: 'Bridal & Groom Styling', estimated: Math.round(allocable * 0.04), notes: 'Ceremony and reception outfits' },
          { item: 'Bridal Makeup & Family Touch-ups', estimated: Math.round(allocable * 0.03), notes: 'HD makeup artist for key functions' },
        ],
        savingTips: ['Explore rental or boutique designer studios for groom sherwani']
      },
      {
        name: 'Music, Sound & Logistics',
        allocated: Math.round(allocable * 0.05),
        percentage: 5,
        priority: 'low',
        breakdown: [
          { item: 'DJ, Dhol & Professional Sound Setup', estimated: Math.round(allocable * 0.035), notes: 'Sangeet night and baraat procession' },
          { item: 'Favors, Welcome Hampers & Invites', estimated: Math.round(allocable * 0.015), notes: 'E-invites with customized box for VIPs' },
        ],
        savingTips: ['Distribute elegant digital WhatsApp invitations to save print and postage']
      }
    ];
  } else if (isBirthday) {
    categories = [
      {
        name: 'Venue & Space Rental',
        allocated: Math.round(allocable * 0.25),
        percentage: 25,
        priority: 'high',
        breakdown: [
          { item: 'Party Lawn / Cafe / Rooftop Lounge', estimated: Math.round(allocable * 0.25), notes: 'Includes 4-5 hours exclusive booking' }
        ],
        savingTips: ['Afternoon or Sunday brunch slots offer significantly lower minimum spends']
      },
      {
        name: 'Food, Beverages & Specialty Cake',
        allocated: Math.round(allocable * 0.35),
        percentage: 35,
        priority: 'high',
        breakdown: [
          { item: 'Party Buffet / Finger Food & Sliders', estimated: Math.round(allocable * 0.27), notes: 'Mix of appetizers and comfort main course' },
          { item: 'Custom Designer Fondant / Floral Cake', estimated: Math.round(allocable * 0.08), notes: '2-tier centerpiece cake with cupcakes' }
        ],
        savingTips: ['Opt for a mocktail punch bowl station instead of individually made drinks']
      },
      {
        name: 'Themed Decor & Balloon Styling',
        allocated: Math.round(allocable * 0.18),
        percentage: 18,
        priority: 'medium',
        breakdown: [
          { item: 'Organic Balloon Arch & Backdrop', estimated: Math.round(allocable * 0.12), notes: 'Custom acrylic name cutout & marquee lights' },
          { item: 'Table Centerpieces & Photo Corner', estimated: Math.round(allocable * 0.06), notes: 'Props, polaroid frame, and lighting' }
        ],
        savingTips: ['DIY photo booth props and fairy light photo walls save up to 50%']
      },
      {
        name: 'Entertainment, Games & Host',
        allocated: Math.round(allocable * 0.14),
        percentage: 14,
        priority: 'medium',
        breakdown: [
          { item: 'Emcee / Games Coordinator / Magician', estimated: Math.round(allocable * 0.09), notes: '2 hours of curated interactive activities' },
          { item: 'Sound System & Playlist Curating', estimated: Math.round(allocable * 0.05), notes: 'Bluetooth PA speakers with party lights' }
        ],
        savingTips: ['Curate high-energy Spotify playlist and have a charismatic friend emcee']
      },
      {
        name: 'Return Gifts & Keepsakes',
        allocated: Math.round(allocable * 0.08),
        percentage: 8,
        priority: 'low',
        breakdown: [
          { item: 'Personalized Favors & Goodie Bags', estimated: Math.round(allocable * 0.08), notes: `Estimated for ${guestCount} attendees` }
        ],
        savingTips: ['Potted succulents or artisanal cookies make thoughtful, affordable favors']
      }
    ];
  } else {
    // Community or Other Event
    categories = [
      {
        name: 'Venue & Infrastructure',
        allocated: Math.round(allocable * 0.30),
        percentage: 30,
        priority: 'high',
        breakdown: [
          { item: 'Community Hall / Ground & Permissions', estimated: Math.round(allocable * 0.20), notes: 'Municipal permits and generator backup' },
          { item: 'Stage, Seating & Marquee Tent', estimated: Math.round(allocable * 0.10), notes: 'Canopy tents, chairs, and podium' }
        ],
        savingTips: ['Leverage community member civic ties for venue subsidized rates']
      },
      {
        name: 'Community Refreshments & Meals',
        allocated: Math.round(allocable * 0.32),
        percentage: 32,
        priority: 'high',
        breakdown: [
          { item: 'Wholesome Community Meal / Prasadam / Thali', estimated: Math.round(allocable * 0.24), notes: `Standard catering for ${guestCount} guests` },
          { item: 'Tea, Coffee & Water Stations', estimated: Math.round(allocable * 0.08), notes: 'Eco-friendly paper cups and continuous dispensers' }
        ],
        savingTips: ['Volunteer-assisted service reduces waitstaff expense']
      },
      {
        name: 'Audio-Visual & Technical Setup',
        allocated: Math.round(allocable * 0.18),
        percentage: 18,
        priority: 'medium',
        breakdown: [
          { item: 'PA System, Cordless Mics & Speakers', estimated: Math.round(allocable * 0.12), notes: 'High-clarity speaker arrays' },
          { item: 'Projector / LED Display & Lighting', estimated: Math.round(allocable * 0.06), notes: 'Stage floodlights and screen projection' }
        ],
        savingTips: ['Source AV equipment from local community audio vendors']
      },
      {
        name: 'Signage, Badges & Collateral',
        allocated: Math.round(allocable * 0.10),
        percentage: 10,
        priority: 'low',
        breakdown: [
          { item: 'Welcome Banners, Standees & Direction Signs', estimated: Math.round(allocable * 0.06), notes: 'Weatherproof vinyl signage' },
          { item: 'Volunteer Badges & Registration Kits', estimated: Math.round(allocable * 0.04), notes: 'Lanyards and registration sheet tokens' }
        ],
        savingTips: ['Digital registration with QR code checking saves printing costs']
      },
      {
        name: 'Cultural Performances / Honorariums',
        allocated: Math.round(allocable * 0.10),
        percentage: 10,
        priority: 'medium',
        breakdown: [
          { item: 'Guest Speakers / Performers / Trophies', estimated: Math.round(allocable * 0.10), notes: 'Moments of appreciation and certificates' }
        ],
        savingTips: ['Invite local school/community artists who appreciate the performance platform']
      }
    ];
  }

  return {
    totalBudget: b,
    categories,
    contingency,
    warnings: [
      'Peak season surcharges may apply for weekend dates; lock early contracts.',
      'Always reserve 5-10% of total budget strictly for emergency day-of incidentals.'
    ],
    suggestions: [
      `Prioritize ${priorities || 'Catering and Venue'} to give your ${guestCount} guests the warmest impression.`,
      'Confirm all vendor advance payment schedules are milestone-based.'
    ]
  };
}

function getFallbackTimeline({ eventType, eventDate, guestCount }) {
  const targetDate = eventDate ? new Date(eventDate) : new Date(Date.now() + 60 * 86400000);
  const now = new Date();
  const diffDays = Math.max(1, Math.ceil((targetDate - now) / 86400000));

  const formatOffset = (daysBefore) => {
    const d = new Date(targetDate.getTime() - daysBefore * 86400000);
    return d.toISOString().split('T')[0];
  };

  const isWedding = eventType === 'wedding';

  return {
    eventDate: targetDate.toISOString().split('T')[0],
    totalDaysRemaining: diffDays,
    phases: [
      {
        name: 'Phase 1: Foundation & Vision',
        startDate: formatOffset(Math.min(diffDays, 90)),
        endDate: formatOffset(Math.min(diffDays - 1, 60)),
        status: diffDays > 60 ? 'completed' : 'current',
        tasks: [
          {
            id: 'task-1',
            title: 'Finalize Guest List & Target Headcount',
            description: `Lock estimated ${guestCount || 100} guests to determine venue capacity and catering scale.`,
            deadline: formatOffset(Math.min(diffDays - 2, 75)),
            priority: 'critical',
            category: 'guest',
            dependsOn: [],
            estimatedCost: 0,
            completed: true
          },
          {
            id: 'task-2',
            title: isWedding ? 'Shortlist & Book Ceremony & Reception Venue' : 'Lock Venue / Location Booking',
            description: 'Visit shortlisted spaces, verify parking, sound restrictions, and pay booking advance.',
            deadline: formatOffset(Math.min(diffDays - 3, 65)),
            priority: 'critical',
            category: 'venue',
            dependsOn: ['task-1'],
            estimatedCost: 50000,
            completed: true
          }
        ]
      },
      {
        name: 'Phase 2: Core Vendor Partnerships',
        startDate: formatOffset(Math.min(diffDays - 4, 60)),
        endDate: formatOffset(Math.min(diffDays - 5, 30)),
        status: diffDays <= 60 && diffDays > 30 ? 'current' : (diffDays <= 30 ? 'completed' : 'upcoming'),
        tasks: [
          {
            id: 'task-3',
            title: 'Menu Tasting & Catering Contract Sign-off',
            description: 'Conduct food tasting with 4 sample dishes and lock per-plate live counter menu.',
            deadline: formatOffset(Math.min(diffDays - 6, 45)),
            priority: 'high',
            category: 'catering',
            dependsOn: ['task-2'],
            estimatedCost: 35000,
            completed: false
          },
          {
            id: 'task-4',
            title: 'Book Photographer & Cinematographer',
            description: 'Review portfolio, verify drone permissions, and confirm deliverable timeline.',
            deadline: formatOffset(Math.min(diffDays - 7, 40)),
            priority: 'high',
            category: 'photography',
            dependsOn: ['task-2'],
            estimatedCost: 25000,
            completed: false
          },
          {
            id: 'task-5',
            title: 'Theme Decor & Floral Design Approval',
            description: 'Finalize color palette, entrance walkthrough, photobooth, and stage 3D render.',
            deadline: formatOffset(Math.min(diffDays - 8, 32)),
            priority: 'medium',
            category: 'decoration',
            dependsOn: ['task-2'],
            estimatedCost: 20000,
            completed: false
          }
        ]
      },
      {
        name: 'Phase 3: Invitations & Experience Curation',
        startDate: formatOffset(Math.min(diffDays - 9, 30)),
        endDate: formatOffset(Math.min(diffDays - 10, 10)),
        status: diffDays <= 30 && diffDays > 10 ? 'current' : 'upcoming',
        tasks: [
          {
            id: 'task-6',
            title: 'Dispatch Digital Invitations & Track RSVPs',
            description: 'Send interactive invites via WhatsApp/email with RSVP tracking.',
            deadline: formatOffset(Math.min(diffDays - 11, 20)),
            priority: 'high',
            category: 'guest',
            dependsOn: ['task-1'],
            estimatedCost: 2500,
            completed: false
          },
          {
            id: 'task-7',
            title: 'Lock Music Playlist & Emcee Coordination',
            description: 'Curate couple entry songs, party high-energy tracks, and dinner playlist.',
            deadline: formatOffset(Math.min(diffDays - 12, 14)),
            priority: 'medium',
            category: 'other',
            dependsOn: [],
            estimatedCost: 15000,
            completed: false
          }
        ]
      },
      {
        name: 'Phase 4: Final Week Countdown & Execution',
        startDate: formatOffset(Math.min(diffDays - 13, 10)),
        endDate: formatOffset(0),
        status: diffDays <= 10 ? 'current' : 'upcoming',
        tasks: [
          {
            id: 'task-8',
            title: 'Final Headcount & Caterer Plate Guarantee Cutoff',
            description: 'Submit locked guest count to caterer 48h prior to avoid food wastage and penalties.',
            deadline: formatOffset(3),
            priority: 'critical',
            category: 'catering',
            dependsOn: ['task-6'],
            estimatedCost: 0,
            completed: false
          },
          {
            id: 'task-9',
            title: 'Prepare Vendor Cash Envelopes & Briefing',
            description: 'Assign one trusted family/team member to manage day-of vendor load-in and payments.',
            deadline: formatOffset(1),
            priority: 'high',
            category: 'other',
            dependsOn: [],
            estimatedCost: 0,
            completed: false
          }
        ]
      }
    ],
    milestones: [
      { title: 'Venue & Caterer Secured', date: formatOffset(Math.min(diffDays - 5, 45)), description: 'Core celebration foundation is locked' },
      { title: 'RSVPs Finalized', date: formatOffset(Math.min(diffDays - 11, 15)), description: 'Headcount locked for kitchen & seating' },
      { title: 'Event Day Showtime!', date: formatOffset(0), description: 'Relax, celebrate, and make memories' }
    ],
    urgentActions: [
      'Lock caterer menu and schedule food tasting session',
      'Confirm photographer availability for the selected dates'
    ]
  };
}

function getFallbackVendorChecklist({ eventType: _eventType, budget }) {
  const b = Number(budget) || 200000;
  return {
    vendors: [
      {
        category: 'Catering & Beverages',
        budgetRange: { min: Math.round(b * 0.22), max: Math.round(b * 0.32) },
        priority: 'essential',
        questionsToAsk: [
          'What live counters (chaat, pasta, dosa, stir fry) are included in the per-plate package?',
          'What is the staff-to-guest ratio? (Recommend 1 server per 20 guests)',
          'Can we conduct a food tasting session with 4 sample dishes before paying the deposit?',
          'How do you manage leftover food safety and distribution?'
        ],
        redFlags: [
          'Hesitation to arrange a live kitchen or food tasting',
          'Vague per-plate inclusions with surprise crockery/cutlery extra charges',
          'Lack of food safety licenses or FSSAI registration'
        ],
        comparisonCriteria: [
          'Per-plate all-inclusive cost',
          'Live counter theatrical quality',
          'Cutlery & banquet linen presentation'
        ],
        bookingTimeline: '3 to 5 months before the celebration',
        tips: [
          'Request complimentary welcome mocktails or dessert upgrades during final negotiations.'
        ]
      },
      {
        category: 'Venue & Banquet Hall',
        budgetRange: { min: Math.round(b * 0.25), max: Math.round(b * 0.38) },
        priority: 'essential',
        questionsToAsk: [
          'Are there any decibel restrictions or curfew timings for outdoor music?',
          'Does the rental fee include electricity, air conditioning, and power generator backup?',
          'Are external decorators and caterers permitted without royalty fees?',
          'What is the dedicated guest parking capacity and valet service availability?'
        ],
        redFlags: [
          'Mandatory tied-in vendors with exorbitant markup rates',
          'No backup diesel generator in the contract',
          'Unclear overtime penalty charges beyond the booked slot'
        ],
        comparisonCriteria: [
          'Seating vs floating guest capacity ratio',
          'Bridal room / VIP green room readiness',
          'Restroom cleanliness and maintenance staff'
        ],
        bookingTimeline: '4 to 6 months before event date',
        tips: [
          'Inspect the venue during an ongoing evening event to see real illumination and acoustics.'
        ]
      },
      {
        category: 'Decor & Theme Styling',
        budgetRange: { min: Math.round(b * 0.12), max: Math.round(b * 0.18) },
        priority: 'recommended',
        questionsToAsk: [
          'Will you provide a 3D visual render or mood board of the stage and entrance arch?',
          'What proportion of the floral design uses fresh seasonal vs artificial silk flowers?',
          'How many hours prior to the event will setup be completely handed over?',
          'Are fairy light canopies and ambient LED wash lighting included in the quote?'
        ],
        redFlags: [
          'Using generic stock photos instead of photos of their own actual past setups',
          'Refusing to itemize entrance, stage, and table centerpiece costs'
        ],
        comparisonCriteria: [
          'Attention to detail and floral freshness',
          'Ability to adapt to custom color palettes',
          'Punctuality on day-of morning setup'
        ],
        bookingTimeline: '2 to 4 months prior',
        tips: [
          'Marigold, rajnigandha, and locally sourced greens provide luxury looks at half the cost of imported orchids.'
        ]
      },
      {
        category: 'Photography & Cinematography',
        budgetRange: { min: Math.round(b * 0.08), max: Math.round(b * 0.14) },
        priority: 'essential',
        questionsToAsk: [
          'Will the lead photographer whose portfolio we viewed shoot our event personally?',
          'What is the turnaround timeline for teaser reels and full processed albums?',
          'Do you provide unedited raw high-resolution footage and photos on a hard drive?',
          'Are drone aerial shots permitted and operated with certified pilots?'
        ],
        redFlags: [
          'Subcontracting to unknown junior freelancers without prior client consent',
          'Delivery timelines exceeding 4 months without milestone accountability'
        ],
        comparisonCriteria: [
          'Candid portrait lighting and color grading style',
          'Cinematic storytelling pacing in trailers',
          'Comfortable rapport with family and guests'
        ],
        bookingTimeline: '3 to 6 months prior',
        tips: [
          'Schedule couple/family portraits 45 minutes before sunset for the golden hour aesthetic.'
        ]
      },
      {
        category: 'Sound, DJ & Entertainment',
        budgetRange: { min: Math.round(b * 0.04), max: Math.round(b * 0.08) },
        priority: 'recommended',
        questionsToAsk: [
          'What sound equipment brands (e.g., JBL, Bose, RCF) do you provide?',
          'Can we share a mandatory must-play and do-not-play tracklist?',
          'Does the quote include wireless cordless mics for speeches and family performances?'
        ],
        redFlags: [
          'Inability to read crowd mood and playing mismatched high-volume tracks during dinner',
          'Sound systems with noticeable echo distortion'
        ],
        comparisonCriteria: [
          'Versatility across Bollywood, retro, Punjabi, and international hits',
          'Professionalism of emcee/hype coordinator'
        ],
        bookingTimeline: '1 to 2 months prior',
        tips: [
          'Bundle lighting trusses with the DJ setup to save 15-20% on separate rental vendors.'
        ]
      }
    ],
    generalTips: [
      'Never pay more than 20-25% as an initial booking advance; link balance payments to clear milestones.',
      'Always have a designated "Vendor Captain" from family/team so you can enjoy your celebration stress-free.'
    ],
    negotiationTips: [
      'Ask for complimentary value adds (mocktail bar, welcome signage, sparkler entry) rather than just lowering quotes.',
      'Check if paying via bank transfer or prompt advance unlocks cash flow discounts.'
    ],
    contractChecklist: [
      'Clear cancellation and force majeure refund percentages',
      'Guaranteed arrival and completion setup time penalties',
      'Explicit backup equipment guarantees for audio, electricity, and photo lenses'
    ]
  };
}

function getFallbackIdeas({ eventType, budget, guestCount }) {
  const b = Number(budget) || 200000;
  const isWedding = eventType === 'wedding';
  const isBirthday = eventType === 'birthday';

  let themes = [];

  if (isWedding) {
    themes = [
      {
        name: 'Royal Heritage & Brass Jharokha',
        description: 'Warm regal aesthetic inspired by Rajasthani courtyards with marigold garlands, brass urli bowls, and terracotta accents.',
        estimatedCost: Math.round(b * 0.16),
        suitability: 'Perfect for culturally rich families wanting an authentic, timeless festive ambiance.',
        elements: {
          decoration: ['Handcrafted marigold torans and floral chandeliers', 'Brass floor urlis with floating rose petals and diya lamps', 'Warm amber fairy light canopy'],
          food: ['Live Dal Baati Churma and Galouti Kebab counters', 'Steaming Jalebi with Rabri live dessert station', 'Royal Kesar Thandai welcome bar'],
          activities: ['Live acoustic sitar & tabla artist during welcome', 'Instant Polaroid guest book with heartfelt blessings', 'Chundari dupatta gifting for ladies'],
          music: ['Sufi acoustic fusion', 'Traditional Shehnai melodies segueing into festive Bollywood classics']
        },
        pros: ['Deeply photogenic in golden hour lighting', 'Uses locally accessible florals that resist wilting'],
        cons: ['Requires early morning setup for fresh flower installations']
      },
      {
        name: 'Pastel Bohemian Garden Soiree',
        description: 'Modern chic celebration with blush pink, ivory, and eucalyptus greens, macrame arches, and minimalist wooden textures.',
        estimatedCost: Math.round(b * 0.14),
        suitability: 'Ideal for contemporary couples wanting an intimate, elegant, breezy celebration.',
        elements: {
          decoration: ['Eucalyptus and white carnation installations', 'Geometric rose-gold arches with sheer chiffon drapes', 'Fairy light tunnel walkway'],
          food: ['Live artisanal pasta and wood-fired pizza corner', 'Gourmet sliders & mezze platters', 'Pastel macaron tower and berry mousse tarts'],
          activities: ['Custom cocktail / mocktail signature drink mixing', 'Audio guestbook rotary phone where friends leave voice messages'],
          music: ['Indie acoustic pop covers', 'Groovy deep house sunset set']
        },
        pros: ['Contemporary aesthetic that looks stellar on Instagram', 'Clean modern presentation guests adore'],
        cons: ['Lighter florals require climate-controlled indoor or shaded outdoor spaces']
      }
    ];
  } else if (isBirthday) {
    themes = [
      {
        name: 'Neon Retro Arcade & Glow Carnival',
        description: 'Electric atmosphere with vibrant LED neon signs, blacklight accents, retro arcade games, and confetti pops.',
        estimatedCost: Math.round(b * 0.18),
        suitability: 'High-energy, unforgettable party vibe loved by teens, young adults, and milestone celebrants.',
        elements: {
          decoration: ['Custom neon quote sign ("Another Year Bolder")', 'Glow stick chandeliers and UV lighting', 'Metallic foil shimmer photo wall'],
          food: ['Gourmet mini burgers, loaded nachos, and cheese fountains', 'Smoking dry-ice mocktails and bubble tea counter', 'Neon tiered confetti celebration cake'],
          activities: ['VR game zone or giant Jenga tournament', 'Glow-in-the-dark face painting and glitter bar', 'Silent disco dance-off'],
          music: ['Retro 90s/2000s throwback dance tracks', 'Live DJ EDM mashups']
        },
        pros: ['Immense energy and guest engagement', 'Extraordinary photos under neon lighting'],
        cons: ['Requires darkened indoor venue or night slot for maximum glow effect']
      },
      {
        name: 'Whimsical Enchanted Woodland Picnic',
        description: 'Fairytale garden setup with low bohemian picnic tables, floor cushions, fairy lights, and botanical accents.',
        estimatedCost: Math.round(b * 0.15),
        suitability: 'Charming, relaxed daytime gathering perfect for kids, intimate family birthdays, or afternoon celebrations.',
        elements: {
          decoration: ['Low wooden pallet tables with boho rugs and velvet cushions', 'Twinkling fairy light strings in garden trees', 'Wildflower mason jar centerpieces'],
          food: ['Artisanal charcuterie boards with fresh fruits, dips, and breads', 'Personalized mini pizzas and fresh fruit skewers', 'Naked berry sponge cake with edible flowers'],
          activities: ['DIY flower crown or badge making station', 'Acoustic guitar singalong circle', 'Lawn croquet and giant ring toss'],
          music: ['Sunny indie folk and acoustic covers']
        },
        pros: ['Ultra-comfortable, conversation-friendly vibe', 'Cost-effective decor utilizing open lawn spaces'],
        cons: ['Weather dependent if hosted outdoors without rain contingency']
      }
    ];
  } else {
    themes = [
      {
        name: 'Cultural Harmony Festival & Mela',
        description: 'Vibrant community gathering with colorful kites, folk art backdrops, marketplace stalls, and shared banquet feasts.',
        estimatedCost: Math.round(b * 0.15),
        suitability: 'Inclusive, family-friendly event promoting community connection and joy across age groups.',
        elements: {
          decoration: ['Colorful Rajasthani umbrella ceiling installation', 'Marigold garland photo entrance', 'Hand-painted chalkboard signage'],
          food: ['Regional food street stalls (chaat, dosa, momos, kebabs)', 'Traditional sweet jalebi & tea samovars'],
          activities: ['Community talent showcase stage', 'Pottery wheel workshop for kids and elders', 'Friendly tug-of-war and kite flying'],
          music: ['Live community band and folk drumming troupes']
        },
        pros: ['Welcoming atmosphere that unites hundreds of community members', 'Interactive hands-on workshops keep all ages engaged'],
        cons: ['Requires strong volunteer coordination for activity management']
      }
    ];
  }

  return {
    themes,
    foodSuggestions: [
      {
        type: 'Grand Celebration Buffet & Live Stations',
        items: ['Amritsari Kulcha with Dal Makhani', 'Paneer Lababdar & Dum Biryani', 'Live Chaat & Dosa Counters', 'Gulab Jamun with Rabri'],
        estimatedCostPerPerson: Math.round((b * 0.25) / Math.max(guestCount, 40)),
        dietaryOptions: ['Pure Vegetarian', 'Jain Options Available', 'Gluten-conscious choices']
      }
    ],
    entertainmentIdeas: [
      { idea: 'Interactive Trivia & Live Polaroid Blessings Wall', cost: 10000, suitableFor: 'All age groups & close circle' },
      { idea: 'Live Acoustic Duo during reception hours', cost: 18000, suitableFor: 'Warm ambient cocktail & dinner vibe' }
    ],
    personalTouches: [
      'Handwritten welcome notes on dining tables mentioning fond memories with guests',
      'Customized digital event hashtag and QR code for guests to instantly upload camera roll photos to a shared album'
    ],
    budgetFriendlyAlternatives: [
      'Opt for fragrant seasonal marigold and jasmine with fairy lights instead of imported exotic cut flowers to save up to 45% on floral decor',
      'Curate a dedicated Spotify playlist for daytime rituals instead of booking full AV bands for secondary hours'
    ]
  };
}

function getFallbackChangeImpact({ currentPlan, changeDescription }) {
  const origBudget = currentPlan?.budget || 500000;
  const isBudgetReduction = changeDescription.toLowerCase().includes('reduce') ||
    changeDescription.toLowerCase().includes('cut') ||
    changeDescription.toLowerCase().includes('tight') ||
    changeDescription.toLowerCase().includes('less');

  const diff = isBudgetReduction ? -Math.round(origBudget * 0.18) : Math.round(origBudget * 0.15);
  const revisedTotal = origBudget + diff;

  return {
    impactSummary: `We analyzed your change "${changeDescription}". CelebriPlan rebalanced your allocations to preserve core guest delight while honoring your target parameters.`,
    affectedAreas: [
      {
        area: 'Catering & Dining Flow',
        impact: 'high',
        description: 'Food and beverage scaling requires slight menu calibration.',
        recommendation: 'Feature 3 signature live counters instead of 6, prioritizing crowd-favorite specialties.'
      },
      {
        area: 'Decor & Theme Production',
        impact: 'medium',
        description: 'Floral and backdrop production adjustments.',
        recommendation: 'Concentrate floral focal points on the main stage and photo booth, switching surrounding perimeters to ambient fairy lights.'
      },
      {
        area: 'Logistics & Collateral',
        impact: 'low',
        description: 'Invites and favor streamlining.',
        recommendation: 'Transition to animated WhatsApp video invites to eliminate printing and delivery overheads.'
      }
    ],
    revisedBudget: {
      original: origBudget,
      revised: revisedTotal,
      difference: diff,
      adjustments: [
        {
          category: 'Venue & Accommodation',
          original: Math.round(origBudget * 0.35),
          revised: Math.round(revisedTotal * 0.35),
          reason: 'Maintained locked venue deposit and prioritized essential spaces'
        },
        {
          category: 'Catering & Live Counters',
          original: Math.round(origBudget * 0.28),
          revised: Math.round(revisedTotal * 0.28),
          reason: 'Streamlined dessert variety and optimized live counter headcount'
        },
        {
          category: 'Decor & Floral Styling',
          original: Math.round(origBudget * 0.15),
          revised: Math.round(revisedTotal * 0.14),
          reason: 'Emphasized lighting architecture over high-cost imported cut florals'
        }
      ]
    },
    tradeoffs: [
      {
        option: 'Consolidate dessert offerings to 2 decadent live counters (e.g., Jalebi Rabri + Ice Cream Sundae)',
        pros: ['Saves significant catering costs without guests feeling any lack of dessert variety', 'Speeds up dinner counter flow'],
        cons: ['Slightly fewer exotic confectionery choices'],
        savings: 20000
      },
      {
        option: 'Repurpose ceremony stage florals for the evening reception',
        pros: ['Cuts floral decor spend by up to 25% with zero aesthetic compromise'],
        cons: ['Requires 45 minutes of vendor crew transfer time between events'],
        savings: 15000
      }
    ],
    nextSteps: [
      'Notify the caterer of the updated menu selections 14 days before the event cutoff',
      'Confirm the stage and lighting plan with the decorator using the optimized layout',
      'Review your updated budget dashboard'
    ],
    risks: [
      'Ensure headcounts are confirmed 72 hours before event day to prevent food over-ordering'
    ]
  };
}

function getFallbackChatResponse(message, eventContext = {}) {
  const m = message.toLowerCase();
  const name = eventContext.eventName || 'your celebration';
  const type = eventContext.eventType || 'event';
  const budget = eventContext.budget ? `₹${Number(eventContext.budget).toLocaleString('en-IN')}` : 'your budget';

  if (m.includes('budget') || m.includes('cost') || m.includes('money') || m.includes('save') || m.includes('cheap')) {
    return `### Smart Budget Strategy for **${name}**

When working within ${budget}, the secret is **strategic prioritization** rather than cutting corners everywhere:

1. **The 80/20 Rule for Food**: Guests remember 2 or 3 stellar dishes and fast service. Focus on 2 stellar live counters (like freshly tossed Chaat or piping hot Jalebi Rabri) rather than expanding to 10 mediocre buffet items.
2. **Lighting Over Florals**: Fabric draping with warm fairy lights and brass floor lamps covers 4x the visual area of fresh imported flowers at one-third the cost.
3. **Vendor Packaging**: Always ask your DJ if they can bundle ambient sound, cordless mics, and stage wash lighting together — you typically get a 15–20% combined discount.
4. **Digital-First Invitations**: Save on printing and courier costs by creating an animated WhatsApp video invitation with an RSVP Google form.

Would you like me to simulate specific tradeoffs on your budget dashboard?`;
  }

  if (m.includes('food') || m.includes('catering') || m.includes('menu')) {
    return `### Menu Curation for **${name}**

For an unforgettable dining experience for your ${eventContext.guestCount || 100} guests:

- **Welcome Refreshment**: Fresh seasonal mocktails (Aam Panna, Mint Mojito, or Masala Chaas) served as guests step in.
- **Appetizers (Pass-around)**: 2 Vegetarian (Paneer Tikka, Crispy Corn) + 2 Non-veg (if applicable) served hot.
- **Theatrical Live Counter**: Live Kulcha & Dal Makhani or interactive Pasta/Dosa counter where guests watch their food made fresh.
- **Dessert Finale**: Warm Gulab Jamun with chilled Rabri, or a signature ice cream bar.

**Pro-tip**: Ensure you schedule your menu tasting with the caterer at least 3 weeks before the date so you can tweak spice levels and presentation!`;
  }

  if (m.includes('vendor') || m.includes('photographer') || m.includes('contract') || m.includes('questions')) {
    return `### Top Vendor Questions to Lock in Now

Before paying any booking advance for **${name}**, verify these 4 non-negotiables:

1. **Advance & Payment Milestones**: Never pay more than 25% upfront. Tie the second installment to setup completion, and final balance to delivery.
2. **Backup Equipment Guarantee**: Ask the sound and photography team if they bring backup generators, spare camera bodies, and extra cordless mics.
3. **Overtime Charges**: Clarify in writing what happens if speeches or dancing run 1 hour over schedule.
4. **Point of Contact**: Confirm that the lead specialist you interviewed will personally be on-site on event day, not an unvetted substitute.

You can inspect the full vendor comparison framework on the **Vendors** tab!`;
  }

  return `Hello! I'm your **CelebriPlan AI Assistant**, keeping **${name}** (${type}) on track and within ${budget}.

Here are some things we can work on right now:
- **Budget Tradeoffs**: How to trim costs without anyone noticing
- **Timeline Milestones**: What you need to lock in this month
- **Vendor Negotiation**: Questions to ask before signing contracts
- **Theme & Decor Ideas**: Fresh concepts tailored to your personal vibe

What would you like to tackle next?`;
}
