/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CategoryInfo, Achievement } from '../types/simulator';

export const SIMULATOR_CATEGORIES: CategoryInfo[] = [
  {
    id: 'flight',
    name: 'Flight Simulator',
    tagline: 'Commercial & Aerobatic Aviation Ops',
    description: 'Master takeoff physics, atmospheric crosswind navigation, and instrument storm landings in advanced jet aircraft.',
    accentColor: 'cyan',
    accentHex: '#06b6d4',
    levels: [
      {
        id: 'flight_1',
        categoryId: 'flight',
        levelNumber: 1,
        title: 'Runway Takeoff & Initial Climb',
        subtitle: 'Basic Avionics & Centerline Alignment',
        briefing: 'Spool engines to 100% throttle, maintain runway center line, rotate flight stick at 135 kts, and climb to 2,500 ft through navigation waypoints.',
        difficulty: 'Novice',
        parTimeSeconds: 45,
        baseScore: 3000,
        objectives: [
          { id: 'takeoff', description: 'Reach 140 kts and execute takeoff rotate', target: 1 },
          { id: 'waypoints', description: 'Fly through altitude waypoints', target: 4, unit: 'rings' },
          { id: 'gear', description: 'Retract landing gear after positive climb', target: 1 },
          { id: 'altitude', description: 'Reach cruise altitude of 2,500 ft', target: 2500, unit: 'ft' }
        ],
        tips: [
          'Throttle UP with W or on-screen slider.',
          'Gently pull back stick (S key or down arrow) at 135 kts.',
          'Press G to retract landing gear once airborne.'
        ]
      },
      {
        id: 'flight_2',
        categoryId: 'flight',
        levelNumber: 2,
        title: 'Mountain Pass Waypoint Navigation',
        subtitle: 'Low Altitude Banking & Crosswinds',
        briefing: 'Navigate through canyon waypoints at 250 kts under turbulent crosswinds. Keep bank angle under control and maintain safe terrain clearance.',
        difficulty: 'Standard',
        parTimeSeconds: 70,
        baseScore: 5000,
        objectives: [
          { id: 'waypoints', description: 'Clear all mountain valley waypoints', target: 6, unit: 'rings' },
          { id: 'bank', description: 'Maintain coordinated turn bank angle', target: 100, unit: '%' },
          { id: 'gforce', description: 'Avoid structural stress G-limits', target: 100, unit: '%' },
          { id: 'speed', description: 'Maintain recommended airspeed (200-260 kts)', target: 220, unit: 'kts' }
        ],
        tips: [
          'Use rudder (A/D) to coordinate turns in crosswinds.',
          'Watch the artificial horizon pitch ladder.',
          'Keep throttle near 75% for optimal maneuverability.'
        ]
      },
      {
        id: 'flight_3',
        categoryId: 'flight',
        levelNumber: 3,
        title: 'Extreme Storm ILS Landing',
        subtitle: 'Zero Visibility & Crosswind Flare',
        briefing: 'Execute instrument approach through thunderstorm squalls. Align glide-slope, deploy flaps and landing gear, and grease the runway touchdown zone.',
        difficulty: 'Expert',
        parTimeSeconds: 85,
        baseScore: 8000,
        objectives: [
          { id: 'approach', description: 'Align with runway localizer beacon', target: 1 },
          { id: 'gear_flaps', description: 'Deploy full flaps & landing gear', target: 2 },
          { id: 'glideslope', description: 'Maintain 3° glide slope descent', target: 100, unit: '%' },
          { id: 'touchdown', description: 'Smooth touchdown in threshold zone (<200 fpm)', target: 1 }
        ],
        tips: [
          'Deploy flaps (F key) to increase lift at low landing speeds.',
          'Lower gear (G key) at 1,000 ft altitude.',
          'Flare flight stick gently just before touchdown to arrest sink rate.'
        ]
      }
    ]
  },
  {
    id: 'driving',
    name: 'Driving Simulator',
    tagline: 'Precision Racing, Slalom & Drift Dynamics',
    description: 'Experience real asphalt tire friction, weight transfer, drift angles, and time attack track challenges.',
    accentColor: 'amber',
    accentHex: '#f59e0b',
    levels: [
      {
        id: 'driving_1',
        categoryId: 'driving',
        levelNumber: 1,
        title: 'Track Apex & Slalom Precision',
        subtitle: 'Racing Line & Braking Zones',
        briefing: 'Complete two laps through technical chicanes and slalom cones. Avoid penalties and master threshold braking at high speed.',
        difficulty: 'Novice',
        parTimeSeconds: 50,
        baseScore: 3500,
        objectives: [
          { id: 'checkpoints', description: 'Hit all timing checkpoints', target: 6, unit: 'gates' },
          { id: 'cones', description: 'Avoid cone collisions', target: 0, unit: 'hits' },
          { id: 'speed', description: 'Top speed above 100 MPH', target: 100, unit: 'MPH' },
          { id: 'finish', description: 'Cross finish line under par time', target: 1 }
        ],
        tips: [
          'Brake before turning into corners, then accelerate on exit.',
          'Use arrow keys or WASD, or on-screen wheel.',
          'Stay on the asphalt to maintain 100% tire grip.'
        ]
      },
      {
        id: 'driving_2',
        categoryId: 'driving',
        levelNumber: 2,
        title: 'Mountain Pass Drift King',
        subtitle: 'Counter-Steer & Angle Multiplier',
        briefing: 'Tear through downhill hairpins. Initiate drifts with the handbrake, counter-steer to sustain angle, and rack up massive drift combo points.',
        difficulty: 'Standard',
        parTimeSeconds: 65,
        baseScore: 6000,
        objectives: [
          { id: 'drift_points', description: 'Earn drift score points', target: 5000, unit: 'pts' },
          { id: 'combo', description: 'Reach 3x Drift Multiplier combo', target: 3, unit: 'x' },
          { id: 'hairpins', description: 'Clear all 4 hairpin apex zones', target: 4, unit: 'apex' },
          { id: 'clean', description: 'Avoid heavy guardrail barrier impacts', target: 3, unit: 'max' }
        ],
        tips: [
          'Tap Spacebar / Handbrake while turning to initiate a drift slide.',
          'Counter-steer in opposite direction of turn to balance car.',
          'Keep on throttle to power slide through the curve.'
        ]
      },
      {
        id: 'driving_3',
        categoryId: 'driving',
        levelNumber: 3,
        title: 'Wet Night Grand Prix Pursuit',
        subtitle: 'Aquaplaning, Rain & Traffic Weave',
        briefing: 'Race in midnight downpour conditions. Navigate standing water puddles with reduced grip, overtake rival vehicles, and set the ultimate lap record.',
        difficulty: 'Expert',
        parTimeSeconds: 75,
        baseScore: 9000,
        objectives: [
          { id: 'overtakes', description: 'Cleanly overtake rival vehicles', target: 8, unit: 'cars' },
          { id: 'puddles', description: 'Recover from aquaplaning hydroplanes', target: 3, unit: 'saves' },
          { id: 'lap_time', description: 'Beat pro driver lap split time', target: 1 },
          { id: 'accuracy', description: 'Maintain track adherence rating', target: 90, unit: '%' }
        ],
        tips: [
          'Tire grip is reduced by 35% on wet tarmac.',
          'Avoid sudden full throttle inside water puddles.',
          'Draft behind traffic before initiating clean overtakes.'
        ]
      }
    ]
  },
  {
    id: 'farming',
    name: 'Farming Simulator',
    tagline: 'Agronomy, Equipment & Yield Logistics',
    description: 'Operate heavy agricultural machinery, manage soil moisture, seed crops, and maximize harvest yields into the silo.',
    accentColor: 'emerald',
    accentHex: '#10b981',
    levels: [
      {
        id: 'farming_1',
        categoryId: 'farming',
        levelNumber: 1,
        title: 'Spring Soil Tillage & Seeding',
        subtitle: 'Cultivator & Planter Operations',
        briefing: 'Prepare the primary field plot using the tractor cultivator. Once soil is tilled, switch to seed drill and plant golden wheat.',
        difficulty: 'Novice',
        parTimeSeconds: 60,
        baseScore: 3500,
        objectives: [
          { id: 'till', description: 'Plow & till raw field soil plots', target: 20, unit: 'plots' },
          { id: 'seed', description: 'Seed wheat into prepared furrow', target: 20, unit: 'plots' },
          { id: 'fuel', description: 'Finish with tractor fuel remaining (>30%)', target: 30, unit: '%' },
          { id: 'coverage', description: 'Achieve 90% field coverage efficiency', target: 90, unit: '%' }
        ],
        tips: [
          'Select Plow tool [1], drive over dry soil to till.',
          'Switch to Seeder tool [2] and drive over tilled earth.',
          'Optimize driving rows to conserve fuel.'
        ]
      },
      {
        id: 'farming_2',
        categoryId: 'farming',
        levelNumber: 2,
        title: 'Irrigation & Crop Nutrient Care',
        subtitle: 'Water Distribution & Weed Mitigation',
        briefing: 'A heatwave is threatening sprouting crops! Deploy the boom sprayer and irrigate plots to maintain optimal 75-90% soil hydration.',
        difficulty: 'Standard',
        parTimeSeconds: 70,
        baseScore: 5500,
        objectives: [
          { id: 'water', description: 'Irrigate thirsty crop plots', target: 24, unit: 'plots' },
          { id: 'moisture', description: 'Maintain average moisture level (>75%)', target: 75, unit: '%' },
          { id: 'weeds', description: 'Eradicate invasive weed patches', target: 6, unit: 'weeds' },
          { id: 'trample', description: 'Zero mature crop trample penalties', target: 0, unit: 'lost' }
        ],
        tips: [
          'Equip Water Sprayer [3] to hydrate plots.',
          'Avoid driving repeatedly over delicate sprouts.',
          'Refill water tank at the farm borehole when depleted.'
        ]
      },
      {
        id: 'farming_3',
        categoryId: 'farming',
        levelNumber: 3,
        title: 'Autumn Bumper Harvest & Silo Logistics',
        subtitle: 'Combine Harvester & Grain Cart',
        briefing: 'The autumn wheat is golden ripe! Operate the heavy combine harvester, fill the grain hopper, and transfer grain to the central elevator silo.',
        difficulty: 'Expert',
        parTimeSeconds: 80,
        baseScore: 8500,
        objectives: [
          { id: 'harvest', description: 'Combine harvest golden wheat plots', target: 28, unit: 'plots' },
          { id: 'hopper', description: 'Fill and unload grain hopper into Silo', target: 2, unit: 'loads' },
          { id: 'yield', description: 'Deliver 1,500 bushels of grain to Silo', target: 1500, unit: 'bu' },
          { id: 'speed', description: 'Complete operation before frost rain', target: 1 }
        ],
        tips: [
          'Switch to Harvester tool [4] to reap mature crops.',
          'When hopper reaches 100%, back up to the Silo hopper to unload.',
          'Higher harvester speed reduces yield quality; keep steady pace.'
        ]
      }
    ]
  },
  {
    id: 'city',
    name: 'City Building Simulator',
    tagline: 'Metropolitan Zoning, Power & Transit',
    description: 'Design living cities from scratch: balance Residential, Commercial, and Industrial zones, utilities, and citizen happiness.',
    accentColor: 'indigo',
    accentHex: '#6366f1',
    levels: [
      {
        id: 'city_1',
        categoryId: 'city',
        levelNumber: 1,
        title: 'Pioneer Township Foundation',
        subtitle: 'Grid Layout & Utility Networks',
        briefing: 'Establish the foundational grid of a new municipality. Lay roads, zone residential and commercial districts, and hook up power and clean water.',
        difficulty: 'Novice',
        parTimeSeconds: 70,
        baseScore: 4000,
        objectives: [
          { id: 'roads', description: 'Construct road transport network', target: 16, unit: 'tiles' },
          { id: 'utilities', description: 'Connect Power Plant & Water Tower', target: 2, unit: 'grids' },
          { id: 'population', description: 'Attract new residents to city', target: 600, unit: 'citizens' },
          { id: 'happiness', description: 'Maintain citizen happiness rating (>70%)', target: 70, unit: '%' }
        ],
        tips: [
          'Citizens will only build homes on zones adjacent to roads.',
          'Ensure power lines connect the generator to neighborhoods.',
          'Keep heavy industry slightly separated from houses.'
        ]
      },
      {
        id: 'city_2',
        categoryId: 'city',
        levelNumber: 2,
        title: 'Green Metropolis & Transit Balance',
        subtitle: 'Budget Surplus & Pollution Mitigation',
        briefing: 'Expand the township into a prosperous green city. Replace smoky plants with wind turbines, build parks to clean smog, and generate a monthly budget surplus.',
        difficulty: 'Standard',
        parTimeSeconds: 90,
        baseScore: 6500,
        objectives: [
          { id: 'population', description: 'Grow population to metropolitan level', target: 1500, unit: 'citizens' },
          { id: 'budget', description: 'Maintain positive cash flow balance', target: 500, unit: '$/sec' },
          { id: 'parks', description: 'Construct community parks & recreation', target: 4, unit: 'parks' },
          { id: 'clean_power', description: 'Power 80% of city via clean energy', target: 80, unit: '%' }
        ],
        tips: [
          'Parks boost nearby land value and residential happiness.',
          'Commercial zones generate high sales tax revenue.',
          'Demolish old structures with bulldozer tool to optimize layout.'
        ]
      },
      {
        id: 'city_3',
        categoryId: 'city',
        levelNumber: 3,
        title: 'Megalopolis Crisis Master',
        subtitle: 'Blackout Recovery & High-Density Boom',
        briefing: 'A sudden transformer failure has caused rolling blackouts across downtown. Deploy emergency micro-turbines, resolve traffic jams, and push happiness to 90%!',
        difficulty: 'Expert',
        parTimeSeconds: 100,
        baseScore: 9500,
        objectives: [
          { id: 'restore_power', description: 'Restore 100% electrical coverage', target: 100, unit: '%' },
          { id: 'population', description: 'Reach high-density metropolis threshold', target: 3000, unit: 'citizens' },
          { id: 'happiness', description: 'Achieve exceptional happiness rating', target: 88, unit: '%' },
          { id: 'treasury', description: 'Accumulate municipal reserve funds', target: 10000, unit: '$' }
        ],
        tips: [
          'Place high-capacity substations near industrial cores.',
          'Expand commercial boulevards to boost job availability.',
          'Monitor the zoning demand bars (R/C/I) to build what is needed.'
        ]
      }
    ]
  }
];

export const GAME_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_flight',
    title: 'Wings of Flight',
    description: 'Complete your maiden flight in the Flight Simulator.',
    category: 'flight',
    icon: 'Plane',
    points: 150
  },
  {
    id: 'storm_master',
    title: 'Squall Conqueror',
    description: 'Successfully land in zero visibility during extreme storm conditions.',
    category: 'flight',
    icon: 'CloudLightning',
    points: 300
  },
  {
    id: 'drift_legend',
    title: 'Tarmac Sovereign',
    description: 'Score over 5,000 drift points in a single driving run.',
    category: 'driving',
    icon: 'Flame',
    points: 250
  },
  {
    id: 'apex_hunter',
    title: 'Precision Lap',
    description: 'Finish a driving course with 95%+ line accuracy.',
    category: 'driving',
    icon: 'Trophy',
    points: 200
  },
  {
    id: 'green_thumb',
    title: 'Agronomist',
    description: 'Successfully plow and seed an entire agricultural field.',
    category: 'farming',
    icon: 'Sprout',
    points: 150
  },
  {
    id: 'silo_full',
    title: 'Bumper Yield',
    description: 'Deliver over 1,500 bushels of golden wheat to the central elevator.',
    category: 'farming',
    icon: 'Wheat',
    points: 250
  },
  {
    id: 'urban_pioneer',
    title: 'City Founder',
    description: 'Found your first thriving municipality with 500+ citizens.',
    category: 'city',
    icon: 'Building2',
    points: 150
  },
  {
    id: 'megalopolis',
    title: 'Metropolitan Mayor',
    description: 'Reach 3,000 citizens with an 88%+ happiness index.',
    category: 'city',
    icon: 'Crown',
    points: 350
  },
  {
    id: 'three_star_hero',
    title: 'Triple Gold Star',
    description: 'Achieve a flawless 3-star rating on any simulation level.',
    category: 'all',
    icon: 'Star',
    points: 200
  },
  {
    id: 'grand_master',
    title: 'Polymath Simulator',
    description: 'Complete at least one level in all four simulator categories.',
    category: 'all',
    icon: 'Compass',
    points: 500
  },
  {
    id: 'cloud_sync_pro',
    title: 'Cloud Fleet Connected',
    description: 'Sync your game progress to cloud storage for cross-device play.',
    category: 'all',
    icon: 'Cloud',
    points: 100
  },
  {
    id: 'challenger',
    title: 'Social Champion',
    description: 'Share your high score challenge with friends.',
    category: 'all',
    icon: 'Share2',
    points: 100
  }
];

export const ACHIEVEMENTS = GAME_ACHIEVEMENTS;
