/* AUTO-GENERATED from data/menu.json — do not edit by hand.
   Run: node build-menu.js */
window.MENU = {
  "shop": {
    "name": "Lakewood Fish & Chips",
    "tagline": "Takeaway Menu — Open 6 Days",
    "phone": "9789 5722",
    "phoneE164": "+61397895722",
    "address": {
      "line1": "Shop 1, 300 Heatherhill Road",
      "suburb": "Frankston",
      "state": "VIC",
      "postcode": "TODO_CONFIRM",
      "note": "Near Shaxton Circle Lake"
    },
    "hours": {
      "monday": {
        "closed": true
      },
      "tuesday": {
        "open": "16:00",
        "close": "20:00"
      },
      "wednesday": {
        "open": "11:30",
        "close": "20:00"
      },
      "thursday": {
        "open": "11:30",
        "close": "20:00"
      },
      "friday": {
        "open": "11:30",
        "close": "20:30"
      },
      "saturday": {
        "open": "12:00",
        "close": "20:00"
      },
      "sunday": {
        "open": "12:00",
        "close": "20:00"
      }
    },
    "notices": [
      "Price, packs & times are subject to change without notice.",
      "All prices are GST inclusive.",
      "Free 1.25L drink on orders over $55."
    ]
  },
  "extraChoices": [
    "Cheese",
    "Egg",
    "Bacon",
    "Onion",
    "Tomato",
    "Lettuce",
    "Beetroot",
    "Pineapple"
  ],
  "categories": [
    {
      "id": "value-packs",
      "name": "Value Packs",
      "items": [
        {
          "id": "meal-for-one",
          "name": "Meal For One",
          "price": 16,
          "includes": [
            "1 Flake",
            "1 Potato Cake",
            "1 Dim Sim",
            "Minimum Chips"
          ]
        },
        {
          "id": "meal-for-two",
          "name": "Meal For Two",
          "price": 28,
          "includes": [
            "2 Flake",
            "2 Potato Cake",
            "2 Dim Sim",
            "Minimum Chips"
          ]
        },
        {
          "id": "kids-pack",
          "name": "Kids Pack",
          "price": 16,
          "includes": [
            "2 Fish Bites",
            "2 Potato Cake",
            "3 Chicken Nuggets",
            "Minimum Chips"
          ]
        },
        {
          "id": "blue-grenadier-special",
          "name": "Blue Grenadier Special",
          "price": 22,
          "includes": [
            "2 Blue Grenadiers",
            "Minimum Chips"
          ]
        },
        {
          "id": "small-family-pack",
          "name": "Small Family Pack",
          "price": 38,
          "includes": [
            "3 Flake",
            "3 Potato Cake",
            "3 Dim Sim",
            "Minimum Chips"
          ]
        },
        {
          "id": "large-family-pack",
          "name": "Large Family Pack",
          "price": 58,
          "includes": [
            "4 Flake",
            "4 Crab Sticks",
            "4 Potato Cake",
            "4 Dim Sim",
            "6 Chips",
            "1.25L Drink"
          ]
        },
        {
          "id": "seafood-pack",
          "name": "Seafood Pack",
          "price": null,
          "priceStatus": "TODO_UNREADABLE_IN_PHOTO",
          "includes": [
            "2 Flake",
            "2 Prawn Cutlets",
            "2 Crab Sticks",
            "2 Scallops",
            "2 Calamari Rings",
            "Minimum Chips"
          ]
        }
      ]
    },
    {
      "id": "fish",
      "name": "Fish",
      "note": "Grilled fish is $0.50 extra.",
      "options": [
        {
          "id": "cooking",
          "name": "Cooking style",
          "choices": [
            {
              "name": "Fried",
              "priceDelta": 0
            },
            {
              "name": "Grilled",
              "priceDelta": 0.5
            }
          ]
        }
      ],
      "items": [
        {
          "id": "flake",
          "name": "Flake",
          "price": 9.5
        },
        {
          "id": "blue-grenadier",
          "name": "Blue Grenadier",
          "price": 9.5
        },
        {
          "id": "whiting",
          "name": "Whiting",
          "price": 9.5
        },
        {
          "id": "barramundi",
          "name": "Barramundi",
          "price": 10
        },
        {
          "id": "fish-bite",
          "name": "Fish Bite",
          "price": 3
        }
      ]
    },
    {
      "id": "seafood",
      "name": "Seafood",
      "items": [
        {
          "id": "scallop",
          "name": "Scallop",
          "price": 3.5
        },
        {
          "id": "crab-stick",
          "name": "Crab Stick",
          "price": 2.5
        },
        {
          "id": "fish-cake",
          "name": "Fish Cake",
          "price": 3
        },
        {
          "id": "calamari-ring",
          "name": "Calamari Ring",
          "price": 2
        },
        {
          "id": "mussel-batter",
          "name": "Mussel in Batter",
          "price": 1.5
        },
        {
          "id": "prawn-cutlet",
          "name": "Prawn Cutlet",
          "price": 3.3
        }
      ]
    },
    {
      "id": "snacks",
      "name": "Snacks",
      "items": [
        {
          "id": "chips-min",
          "name": "Chips (Minimum)",
          "price": 5.5
        },
        {
          "id": "potato-cake",
          "name": "Potato Cake",
          "price": 1.6
        },
        {
          "id": "dim-sim",
          "name": "Dim Sim (Steamed or Fried)",
          "price": 1.6,
          "options": [
            {
              "id": "prep",
              "name": "Preparation",
              "choices": [
                {
                  "name": "Steamed",
                  "priceDelta": 0
                },
                {
                  "name": "Fried",
                  "priceDelta": 0
                }
              ]
            }
          ]
        },
        {
          "id": "dim-sim-batter",
          "name": "Dim Sim in Batter",
          "price": 2.2
        },
        {
          "id": "corn-jack",
          "name": "Corn Jack",
          "price": 3
        },
        {
          "id": "chiko-roll",
          "name": "Chiko Roll",
          "price": 3
        },
        {
          "id": "spring-roll",
          "name": "Spring Roll",
          "price": 3
        },
        {
          "id": "sausage-batter",
          "name": "Sausage in Batter",
          "price": 3.5
        },
        {
          "id": "hamburger-batter",
          "name": "Hamburger in Batter",
          "price": 5
        },
        {
          "id": "chicken-nuggets",
          "name": "Chicken Nuggets",
          "price": 1.1,
          "bulk": {
            "qty": 6,
            "price": 6,
            "label": "6 for $6"
          }
        },
        {
          "id": "chicken-croquette",
          "name": "Chicken Croquette",
          "price": 3
        },
        {
          "id": "beef-croquette",
          "name": "Beef Croquette",
          "price": 3
        },
        {
          "id": "pickled-onion",
          "name": "Pickled Onion",
          "price": 1.5
        }
      ]
    },
    {
      "id": "burgers",
      "name": "Burgers",
      "extras": {
        "pricePerExtra": 0.6,
        "pineapple": 0.6
      },
      "items": [
        {
          "id": "burger-plain",
          "name": "Plain Burger",
          "price": 9,
          "description": "With lettuce & sauce."
        },
        {
          "id": "burger-lot",
          "name": "The LOT",
          "price": 13,
          "description": "With lettuce, tomato, egg, bacon, onion, cheese & sauce."
        },
        {
          "id": "burger-fish",
          "name": "Fish Burger (Fried Flake)",
          "price": 12,
          "description": "With lettuce, tomato and mayonnaise."
        },
        {
          "id": "burger-veg",
          "name": "Vegetarian Burger (Veggie Patty)",
          "price": 9,
          "description": "With lettuce, tomato, onion & sauce."
        },
        {
          "id": "roll-egg-bacon",
          "name": "Egg & Bacon Roll",
          "price": 6
        },
        {
          "id": "roll-ebc",
          "name": "Egg, Bacon & Cheese Roll",
          "price": 6.6
        }
      ]
    },
    {
      "id": "steak-sandwiches",
      "name": "Steak Sandwiches",
      "extras": {
        "pricePerExtra": 0.6,
        "pineapple": 0.6
      },
      "items": [
        {
          "id": "steak-plain",
          "name": "Plain Steak Sandwich",
          "price": 11,
          "description": "Scotch fillet, lettuce & sauce."
        },
        {
          "id": "steak-lot",
          "name": "Steak Sandwich — The LOT",
          "price": 15,
          "description": "Scotch fillet with lettuce, tomato, egg, bacon, onion, cheese & sauce."
        }
      ]
    },
    {
      "id": "chicken-schnitzel",
      "name": "Chicken Schnitzel",
      "extras": {
        "pricePerExtra": 0.6,
        "pineapple": 0.6
      },
      "items": [
        {
          "id": "schnitzel-burger",
          "name": "Chicken Schnitzel Burger",
          "price": 12,
          "description": "With lettuce, cheese and mayonnaise."
        },
        {
          "id": "schnitzel-plain",
          "name": "Plain Chicken Schnitzel",
          "price": 9
        }
      ]
    },
    {
      "id": "souvlaki",
      "name": "Souvlaki",
      "items": [
        {
          "id": "souvlaki-lamb",
          "name": "Lamb Souvlaki",
          "price": 13,
          "description": "With lettuce, tomato, onion & garlic sauce."
        },
        {
          "id": "souvlaki-chicken",
          "name": "Chicken Souvlaki",
          "price": 13,
          "description": "With lettuce, tomato, onion & garlic sauce."
        },
        {
          "id": "souvlaki-fish",
          "name": "Fish Souvlaki (Fried Flake)",
          "price": 13,
          "description": "With lettuce, tomato & garlic sauce."
        },
        {
          "id": "souvlaki-veg",
          "name": "Vegetarian Souvlaki",
          "price": 10,
          "description": "With lettuce, tomato, onion & garlic sauce."
        }
      ]
    },
    {
      "id": "sweets",
      "name": "Sweets",
      "items": [
        {
          "id": "pineapple-fritter",
          "name": "Pineapple Fritter",
          "price": 3
        },
        {
          "id": "mars-bar-batter",
          "name": "Mars Bar in Batter",
          "price": 5
        }
      ]
    },
    {
      "id": "drinks",
      "name": "Drinks",
      "status": "TODO_NOT_ON_PRINTED_MENU",
      "items": []
    }
  ]
};
