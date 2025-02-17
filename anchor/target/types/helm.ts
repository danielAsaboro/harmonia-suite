/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/helm.json`.
 */
export type Helm = {
  "address": "D9nBEe6FjDwub19rBUPUsThMqgBYF4aGCNaYBVcGr2zf",
  "metadata": {
    "name": "helm",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addAdmin",
      "discriminator": [
        177,
        236,
        33,
        205,
        124,
        152,
        55,
        186
      ],
      "accounts": [
        {
          "name": "adminList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "twitterAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "addCreator",
      "discriminator": [
        120,
        140,
        147,
        174,
        149,
        203,
        237,
        81
      ],
      "accounts": [
        {
          "name": "creatorList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "twitterAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "creator",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "approveContent",
      "discriminator": [
        226,
        212,
        140,
        223,
        153,
        34,
        158,
        189
      ],
      "accounts": [
        {
          "name": "content",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "content.twitter_account",
                "account": "content"
              },
              {
                "kind": "account",
                "path": "content.author",
                "account": "content"
              },
              {
                "kind": "account",
                "path": "content.content_hash",
                "account": "content"
              }
            ]
          }
        },
        {
          "name": "twitterAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "adminList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "cancelContent",
      "discriminator": [
        168,
        227,
        134,
        214,
        215,
        48,
        160,
        15
      ],
      "accounts": [
        {
          "name": "content",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "content.twitter_account",
                "account": "content"
              },
              {
                "kind": "account",
                "path": "content.author",
                "account": "content"
              },
              {
                "kind": "account",
                "path": "content.content_hash",
                "account": "content"
              }
            ]
          }
        },
        {
          "name": "twitterAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "adminList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "registerTwitterAccount",
      "discriminator": [
        4,
        47,
        118,
        85,
        157,
        85,
        181,
        238
      ],
      "accounts": [
        {
          "name": "twitterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "twitterId"
              }
            ]
          }
        },
        {
          "name": "adminList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "twitterId"
              }
            ]
          }
        },
        {
          "name": "creatorList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "twitterId"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "twitterId",
          "type": "string"
        },
        {
          "name": "twitterHandle",
          "type": "string"
        }
      ]
    },
    {
      "name": "rejectContent",
      "discriminator": [
        32,
        251,
        81,
        216,
        95,
        188,
        171,
        42
      ],
      "accounts": [
        {
          "name": "content",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "content.twitter_account",
                "account": "content"
              },
              {
                "kind": "account",
                "path": "content.author",
                "account": "content"
              },
              {
                "kind": "account",
                "path": "content.content_hash",
                "account": "content"
              }
            ]
          }
        },
        {
          "name": "twitterAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "adminList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "removeAdmin",
      "discriminator": [
        74,
        202,
        71,
        106,
        252,
        31,
        72,
        183
      ],
      "accounts": [
        {
          "name": "adminList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "twitterAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeCreator",
      "discriminator": [
        125,
        152,
        5,
        6,
        49,
        239,
        31,
        166
      ],
      "accounts": [
        {
          "name": "creatorList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "twitterAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "creator",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "submitForApproval",
      "discriminator": [
        91,
        188,
        21,
        190,
        3,
        3,
        113,
        133
      ],
      "accounts": [
        {
          "name": "content",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitterAccount"
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "contentHash"
              }
            ]
          }
        },
        {
          "name": "twitterAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "adminList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  45,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "contentType",
          "type": {
            "defined": {
              "name": "contentType"
            }
          }
        },
        {
          "name": "contentHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "scheduledFor",
          "type": {
            "option": "i64"
          }
        }
      ]
    },
    {
      "name": "verifyTwitterAccount",
      "discriminator": [
        172,
        209,
        187,
        165,
        197,
        92,
        205,
        59
      ],
      "accounts": [
        {
          "name": "twitterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  119,
                  105,
                  116,
                  116,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "twitter_account.twitter_id",
                "account": "twitterAccount"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "adminList",
      "discriminator": [
        253,
        56,
        210,
        167,
        203,
        37,
        230,
        165
      ]
    },
    {
      "name": "content",
      "discriminator": [
        3,
        76,
        253,
        21,
        4,
        198,
        52,
        206
      ]
    },
    {
      "name": "creatorList",
      "discriminator": [
        101,
        103,
        204,
        188,
        6,
        221,
        70,
        109
      ]
    },
    {
      "name": "twitterAccount",
      "discriminator": [
        37,
        124,
        30,
        178,
        50,
        255,
        76,
        25
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "twitterAccountNotVerified",
      "msg": "Twitter account not verified"
    },
    {
      "code": 6001,
      "name": "alreadyVerified",
      "msg": "Twitter account already verified"
    },
    {
      "code": 6002,
      "name": "invalidTwitterHandle",
      "msg": "Invalid Twitter handle format"
    },
    {
      "code": 6003,
      "name": "invalidTwitterId",
      "msg": "Invalid Twitter ID format"
    },
    {
      "code": 6004,
      "name": "invalidContentStatus",
      "msg": "Invalid content status for operation"
    },
    {
      "code": 6005,
      "name": "contentInTerminalState",
      "msg": "Content is in terminal state"
    },
    {
      "code": 6006,
      "name": "contentNotActive",
      "msg": "Content not active"
    },
    {
      "code": 6007,
      "name": "invalidStateTransition",
      "msg": "Invalid state transition"
    },
    {
      "code": 6008,
      "name": "alreadySubmitted",
      "msg": "Content already submitted for approval"
    },
    {
      "code": 6009,
      "name": "alreadyApproved",
      "msg": "Content already approved by this admin"
    },
    {
      "code": 6010,
      "name": "insufficientApprovals",
      "msg": "Insufficient approvals"
    },
    {
      "code": 6011,
      "name": "invalidRequiredApprovals",
      "msg": "Invalid minimum required approvals"
    },
    {
      "code": 6012,
      "name": "adminAlreadyExists",
      "msg": "Admin already exists"
    },
    {
      "code": 6013,
      "name": "adminDoesNotExist",
      "msg": "Admin does not exist"
    },
    {
      "code": 6014,
      "name": "cannotRemoveLastAdmin",
      "msg": "Cannot remove last admin"
    },
    {
      "code": 6015,
      "name": "maxAdminsReached",
      "msg": "Maximum number of admins reached"
    },
    {
      "code": 6016,
      "name": "creatorAlreadyExists",
      "msg": "Creator already exists"
    },
    {
      "code": 6017,
      "name": "creatorDoesNotExist",
      "msg": "Creator does not exist"
    },
    {
      "code": 6018,
      "name": "maxCreatorsReached",
      "msg": "Maximum number of creators reached"
    },
    {
      "code": 6019,
      "name": "invalidScheduleTime",
      "msg": "Invalid scheduling time"
    },
    {
      "code": 6020,
      "name": "scheduleTimeRequired",
      "msg": "Schedule time required"
    },
    {
      "code": 6021,
      "name": "scheduleTimeInPast",
      "msg": "Schedule time in past"
    },
    {
      "code": 6022,
      "name": "unauthorized",
      "msg": "Not authorized"
    },
    {
      "code": 6023,
      "name": "invalidTwitterAccount",
      "msg": "Invalid Twitter account"
    },
    {
      "code": 6024,
      "name": "invalidContentHash",
      "msg": "Invalid content hash"
    },
    {
      "code": 6025,
      "name": "contentTooLong",
      "msg": "Content too long"
    },
    {
      "code": 6026,
      "name": "threadTooLong",
      "msg": "Thread too long"
    },
    {
      "code": 6027,
      "name": "tooManyRequests",
      "msg": "Too many requests"
    }
  ],
  "types": [
    {
      "name": "adminList",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "twitterAccount",
            "docs": [
              "The Twitter account this admin list belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "admins",
            "docs": [
              "List of admin public keys that can approve content"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "authority",
            "docs": [
              "Authority who can add/remove admins (usually twitter_account owner)"
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "content",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "twitterAccount",
            "docs": [
              "Reference to the Twitter account this content belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "author",
            "docs": [
              "Content creator's public key"
            ],
            "type": "pubkey"
          },
          {
            "name": "contentType",
            "docs": [
              "Content type (single tweet or thread)"
            ],
            "type": {
              "defined": {
                "name": "contentType"
              }
            }
          },
          {
            "name": "contentHash",
            "docs": [
              "Keccak256 hash of the content"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "scheduledFor",
            "docs": [
              "Unix timestamp for scheduled publication"
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "status",
            "docs": [
              "Current content status"
            ],
            "type": {
              "defined": {
                "name": "contentStatus"
              }
            }
          },
          {
            "name": "approvals",
            "docs": [
              "List of admin approvals"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "rejectionReason",
            "docs": [
              "Reason for rejection if rejected"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "failureReason",
            "docs": [
              "Reason for failure if failed"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "createdAt",
            "docs": [
              "When the content was created"
            ],
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "docs": [
              "Last time content was modified"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "contentStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "draft"
          },
          {
            "name": "pendingApproval"
          },
          {
            "name": "approved"
          },
          {
            "name": "rejected"
          },
          {
            "name": "published"
          },
          {
            "name": "failed"
          },
          {
            "name": "canceled"
          }
        ]
      }
    },
    {
      "name": "contentType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "tweet"
          },
          {
            "name": "thread",
            "fields": [
              {
                "name": "tweetCount",
                "type": "u8"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "creatorList",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "twitterAccount",
            "docs": [
              "The Twitter account this creator list belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "creators",
            "docs": [
              "List of creator public keys that can create content"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "authority",
            "docs": [
              "Authority who can add/remove creators (usually twitter_account owner)"
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "twitterAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "The wallet that initialized this Twitter account integration"
            ],
            "type": "pubkey"
          },
          {
            "name": "twitterId",
            "docs": [
              "Twitter account identifier (off-chain)"
            ],
            "type": "string"
          },
          {
            "name": "twitterHandle",
            "docs": [
              "Twitter handle (off-chain verification)"
            ],
            "type": "string"
          },
          {
            "name": "requiredApprovals",
            "docs": [
              "Required number of approvals for this account"
            ],
            "type": "u8"
          },
          {
            "name": "isVerified",
            "docs": [
              "Whether the Twitter account is verified with the service"
            ],
            "type": "bool"
          },
          {
            "name": "createdAt",
            "docs": [
              "When this integration was created"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};
