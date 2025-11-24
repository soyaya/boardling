import express from "express";
import { optionalApiKey } from "../middleware/auth.js";

const router = express.Router();

/**
 * Zcash Development Alternatives Overview
 * Comprehensive guide to WebZjs and zcash-devtool as alternatives to full RPC servers
 */

/**
 * Get overview of all Zcash development alternatives
 * GET /api/alternatives/overview
 */
router.get("/overview", optionalApiKey, async (req, res) => {
  res.json({
    success: true,
    zcash_development_alternatives: {
      overview: "WebZjs and zcash-devtool are alternatives to running full Zcash nodes like Zebra or Zaino. They avoid RocksDB compilation issues and provide lighter-weight development options.",
      
      problem_solved: [
        "Avoid RocksDB and C++ header compilation issues",
        "No need for full node synchronization",
        "Faster development setup",
        "No RPC authentication complexity",
        "Lighter resource requirements"
      ],

      alternatives: {
        webzjs: {
          name: "WebZjs - Browser Zcash Client",
          type: "Browser-focused client library",
          best_for: "Web wallets, browser extensions, frontend applications",
          
          key_features: [
            "Browser-only wallet operations",
            "gRPC-web proxy to remote lightwalletd",
            "No full node required",
            "JavaScript/TypeScript integration",
            "Wallet creation and synchronization"
          ],

          advantages: [
            "No server-side infrastructure needed",
            "Fast setup and development",
            "No blockchain synchronization",
            "ChainSafe hosted proxies available",
            "Pure JavaScript/Wasm implementation"
          ],

          limitations: [
            "Browser-only (limited server-side use)",
            "Depends on external proxy services",
            "Under active development",
            "Limited transaction sending capabilities",
            "No production security audits"
          ],

          setup_complexity: "Low - npm install and basic JavaScript",
          api_endpoint: "/api/webzjs",
          documentation: "https://chainsafe.github.io/WebZjs/"
        },

        zcash_devtool: {
          name: "zcash-devtool - CLI Prototyping Tool",
          type: "Command-line interface tool",
          best_for: "Local testing, prototyping, CLI-based development",
          
          key_features: [
            "CLI-based wallet operations",
            "Remote light server synchronization",
            "Pure Rust implementation",
            "SQLite storage (no RocksDB)",
            "Official Zcash Foundation tool"
          ],

          advantages: [
            "Official Zcash Foundation support",
            "No C++ dependencies",
            "Fast prototyping capabilities",
            "Stateless operations",
            "Good for testing wallet logic"
          ],

          limitations: [
            "CLI-only interface",
            "Experimental status",
            "Basic functionality only",
            "Manual command execution required",
            "Not suitable for production"
          ],

          setup_complexity: "Medium - Rust toolchain and Age encryption",
          api_endpoint: "/api/zcash-devtool",
          documentation: "https://github.com/zcash/zcash-devtool"
        }
      },

      comparison_matrix: {
        criteria: {
          "Full Node Required": {
            "Zebra/Zaino": "Yes",
            "WebZjs": "No",
            "zcash-devtool": "No"
          },
          "RPC Support": {
            "Zebra/Zaino": "Full JSON-RPC",
            "WebZjs": "gRPC-web proxy",
            "zcash-devtool": "CLI wrappers"
          },
          "Build Complexity": {
            "Zebra/Zaino": "High (RocksDB/C++)",
            "WebZjs": "Low (npm/yarn)",
            "zcash-devtool": "Medium (Rust)"
          },
          "Use Case": {
            "Zebra/Zaino": "Production servers",
            "WebZjs": "Browser applications",
            "zcash-devtool": "Local prototyping"
          },
          "Network Dependency": {
            "Zebra/Zaino": "Full sync required",
            "WebZjs": "Remote proxy",
            "zcash-devtool": "Light server"
          }
        }
      },

      decision_guide: {
        choose_webzjs_if: [
          "Building web-based wallet applications",
          "Need browser-compatible Zcash integration",
          "Want to avoid server infrastructure",
          "Developing frontend-only applications",
          "Need quick prototyping for web apps"
        ],
        
        choose_zcash_devtool_if: [
          "Need CLI-based wallet testing",
          "Prototyping wallet functionality",
          "Learning Zcash concepts",
          "Building command-line tools",
          "Want official Zcash Foundation tools"
        ],
        
        choose_full_rpc_if: [
          "Building production server applications",
          "Need complete RPC functionality",
          "Require advanced transaction features",
          "Building enterprise solutions",
          "Need full blockchain access"
        ]
      },

      migration_paths: {
        from_rpc_to_webzjs: [
          "Replace RPC calls with WebZjs wallet methods",
          "Move from server-side to browser-side operations",
          "Use proxy URLs instead of local RPC endpoints",
          "Adapt authentication to browser-based flows"
        ],
        
        from_rpc_to_devtool: [
          "Convert RPC calls to CLI commands",
          "Use file-based wallet storage",
          "Implement CLI command execution",
          "Adapt to stateless operation model"
        ],
        
        prototyping_workflow: [
          "Start with zcash-devtool for concept validation",
          "Move to WebZjs for browser implementation",
          "Scale to full RPC for production deployment"
        ]
      },

      getting_started: {
        webzjs: {
          quick_start: "GET /api/webzjs/config",
          create_wallet: "POST /api/webzjs/wallet/create",
          setup_guide: "GET /api/webzjs/guide"
        },
        
        zcash_devtool: {
          quick_start: "GET /api/zcash-devtool/config", 
          create_wallet: "POST /api/zcash-devtool/wallet/create",
          setup_guide: "GET /api/zcash-devtool/guide"
        }
      },

      support_resources: {
        webzjs: {
          repository: "https://github.com/ChainSafe/WebZjs",
          documentation: "https://chainsafe.github.io/WebZjs/",
          examples: "https://github.com/ChainSafe/WebZjs/tree/main/examples"
        },
        
        zcash_devtool: {
          repository: "https://github.com/zcash/zcash-devtool",
          walkthrough: "https://github.com/zcash/zcash-devtool/blob/main/doc/walkthrough.md",
          video_guide: "https://www.youtube.com/watch?v=5gvQF5oFT8E"
        },
        
        general: {
          zcash_docs: "https://zcash.readthedocs.io/",
          community_forum: "https://forum.zcashcommunity.com/",
          developer_discord: "https://discord.gg/zcash"
        }
      }
    }
  });
});

/**
 * Get specific alternative recommendation based on use case
 * POST /api/alternatives/recommend
 */
router.post("/recommend", optionalApiKey, async (req, res) => {
  const { 
    use_case, 
    platform, 
    experience_level, 
    production_ready, 
    infrastructure_preference 
  } = req.body;

  // Simple recommendation logic
  let recommendation = {
    primary: null,
    secondary: null,
    reasoning: [],
    next_steps: []
  };

  // Determine primary recommendation
  if (platform === 'browser' || platform === 'web') {
    recommendation.primary = 'webzjs';
    recommendation.reasoning.push('WebZjs is designed specifically for browser-based applications');
  } else if (platform === 'cli' || use_case === 'prototyping') {
    recommendation.primary = 'zcash-devtool';
    recommendation.reasoning.push('zcash-devtool excels at CLI-based prototyping and testing');
  } else if (production_ready === true) {
    recommendation.primary = 'full-rpc';
    recommendation.reasoning.push('Production applications typically require full RPC functionality');
  } else if (infrastructure_preference === 'minimal') {
    recommendation.primary = 'webzjs';
    recommendation.reasoning.push('WebZjs requires minimal infrastructure setup');
  } else {
    recommendation.primary = 'zcash-devtool';
    recommendation.reasoning.push('zcash-devtool is good for general development and learning');
  }

  // Determine secondary recommendation
  if (recommendation.primary === 'webzjs') {
    recommendation.secondary = 'zcash-devtool';
    recommendation.reasoning.push('zcash-devtool complements WebZjs for backend testing');
  } else if (recommendation.primary === 'zcash-devtool') {
    recommendation.secondary = 'webzjs';
    recommendation.reasoning.push('WebZjs can handle browser-side operations');
  }

  // Add experience-based reasoning
  if (experience_level === 'beginner') {
    recommendation.reasoning.push('Chosen options have simpler setup requirements');
  } else if (experience_level === 'advanced') {
    recommendation.reasoning.push('Advanced users can handle more complex setups if needed');
  }

  // Generate next steps
  if (recommendation.primary === 'webzjs') {
    recommendation.next_steps = [
      'GET /api/webzjs/config - Review WebZjs configuration',
      'POST /api/webzjs/wallet/create - Create your first WebZjs wallet',
      'GET /api/webzjs/guide - Follow the complete setup guide'
    ];
  } else if (recommendation.primary === 'zcash-devtool') {
    recommendation.next_steps = [
      'GET /api/zcash-devtool/config - Review zcash-devtool setup',
      'Install Rust toolchain and Age encryption',
      'POST /api/zcash-devtool/wallet/create - Create CLI wallet configuration',
      'GET /api/zcash-devtool/guide - Follow the complete setup guide'
    ];
  } else {
    recommendation.next_steps = [
      'Consider hosted RPC services like GetBlock.io',
      'Review Zebra/Zaino setup documentation',
      'Evaluate infrastructure requirements'
    ];
  }

  res.json({
    success: true,
    recommendation: {
      primary_choice: recommendation.primary,
      secondary_choice: recommendation.secondary,
      confidence: 'medium', // Could be calculated based on input completeness
      reasoning: recommendation.reasoning,
      next_steps: recommendation.next_steps
    },
    input_analysis: {
      use_case: use_case || 'not specified',
      platform: platform || 'not specified', 
      experience_level: experience_level || 'not specified',
      production_ready: production_ready || false,
      infrastructure_preference: infrastructure_preference || 'not specified'
    },
    alternatives_overview: '/api/alternatives/overview'
  });
});

/**
 * Get setup comparison between alternatives
 * GET /api/alternatives/setup-comparison
 */
router.get("/setup-comparison", optionalApiKey, async (req, res) => {
  res.json({
    success: true,
    setup_comparison: {
      webzjs: {
        time_to_setup: "5-15 minutes",
        prerequisites: [
          "Node.js/npm or Yarn",
          "Modern browser with WebAssembly support"
        ],
        optional_requirements: [
          "Rust nightly (for Wasm builds)",
          "wasm-pack (for custom builds)",
          "Clang 17+ (for compilation)"
        ],
        setup_steps: 4,
        complexity: "Low",
        first_wallet_time: "< 5 minutes"
      },
      
      zcash_devtool: {
        time_to_setup: "15-30 minutes",
        prerequisites: [
          "Rust toolchain",
          "Git",
          "Age encryption tool"
        ],
        optional_requirements: [
          "Terminal/command line experience"
        ],
        setup_steps: 6,
        complexity: "Medium", 
        first_wallet_time: "10-15 minutes"
      },
      
      full_rpc: {
        time_to_setup: "1-4 hours",
        prerequisites: [
          "C++ compiler",
          "RocksDB dependencies",
          "Significant disk space (>100GB)",
          "Reliable internet connection"
        ],
        optional_requirements: [
          "Docker (for containerized setup)",
          "System administration experience"
        ],
        setup_steps: 10,
        complexity: "High",
        first_wallet_time: "2-4 hours (including sync)"
      }
    },
    
    feature_comparison: {
      wallet_operations: {
        "Create wallet": {
          webzjs: "✓ Browser-based",
          zcash_devtool: "✓ CLI-based", 
          full_rpc: "✓ RPC calls"
        },
        "Generate addresses": {
          webzjs: "✓ Shielded & transparent",
          zcash_devtool: "✓ CLI commands",
          full_rpc: "✓ Full RPC support"
        },
        "Check balance": {
          webzjs: "✓ Via proxy sync",
          zcash_devtool: "✓ CLI balance command",
          full_rpc: "✓ Real-time RPC"
        },
        "Send transactions": {
          webzjs: "Limited",
          zcash_devtool: "Basic",
          full_rpc: "✓ Full support"
        }
      },
      
      development_features: {
        "API integration": {
          webzjs: "JavaScript/TypeScript",
          zcash_devtool: "CLI/shell scripts",
          full_rpc: "Any language with HTTP"
        },
        "Testing capabilities": {
          webzjs: "Browser testing",
          zcash_devtool: "CLI prototyping",
          full_rpc: "Full test suites"
        },
        "Production readiness": {
          webzjs: "Prototype only",
          zcash_devtool: "Development only",
          full_rpc: "Production ready"
        }
      }
    },
    
    cost_analysis: {
      infrastructure_cost: {
        webzjs: "$0 (uses hosted proxies)",
        zcash_devtool: "$0 (local CLI tool)",
        full_rpc: "$50-200/month (server + storage)"
      },
      
      development_time: {
        webzjs: "Fast prototyping",
        zcash_devtool: "Medium prototyping", 
        full_rpc: "Slower initial setup, faster long-term"
      },
      
      maintenance_effort: {
        webzjs: "Low (proxy dependency)",
        zcash_devtool: "Low (local tool)",
        full_rpc: "High (node maintenance)"
      }
    }
  });
});

export default router;