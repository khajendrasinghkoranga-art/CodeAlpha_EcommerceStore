/* ===================================================
   NOVA STORE — Product Data Store
   =================================================== */

const PRODUCTS = [
  // ── AUDIO ──
  {
    id: "p1",
    name: "Nova Pro X Headphones",
    category: "Audio",
    price: 349,
    originalPrice: 449,
    image: "assets/images/products/headphones.png",
    badge: "hot",
    rating: 4.9,
    reviews: 2400,
    description: "Experience studio-grade sound with 40mm custom drivers, adaptive noise cancellation, and 60-hour battery life. Premium memory foam ear cushions for all-day comfort.",
    specs: {
      "Driver Size": "40mm Custom",
      "Battery": "60 hours",
      "Noise Cancellation": "Adaptive ANC",
      "Connectivity": "Bluetooth 5.3, USB-C",
      "Weight": "254g",
      "Colors": "Matte Black, Silver"
    },
    inStock: true,
    featured: true
  },
  {
    id: "p2",
    name: "AirPods Flex",
    category: "Audio",
    price: 199,
    originalPrice: 269,
    image: "assets/images/products/earbuds.png",
    badge: "sale",
    rating: 4.7,
    reviews: 3100,
    description: "Transparent hearing, immersive sound. These earbuds feature spatial audio, sweat resistance, and seamless device switching with 32-hour total battery life.",
    specs: {
      "Driver Size": "12mm",
      "Battery": "8h + 24h case",
      "Noise Cancellation": "Active + Transparency",
      "Connectivity": "Bluetooth 5.3",
      "Weight": "5.4g per bud",
      "Water Resistance": "IPX5"
    },
    inStock: true,
    featured: true
  },
  {
    id: "p3",
    name: "Pulse Bluetooth Speaker",
    category: "Audio",
    price: 129,
    originalPrice: null,
    image: "assets/images/products/speaker_pulse.jpg",
    badge: "new",
    rating: 4.8,
    reviews: 1500,
    description: "360° immersive sound with deep bass. Waterproof design, 24-hour playtime, and built-in party mode with LED light sync.",
    specs: {
      "Output": "30W",
      "Battery": "24 hours",
      "Water Resistance": "IP67",
      "Connectivity": "Bluetooth 5.2",
      "Weight": "680g",
      "Features": "Party Mode, LED Sync"
    },
    inStock: true,
    featured: true
  },
  {
    id: "p4",
    name: "Studio Monitor Pro",
    category: "Audio",
    price: 549,
    originalPrice: 699,
    image: "assets/images/products/headphones_studio.jpg",
    badge: "sale",
    rating: 4.9,
    reviews: 890,
    description: "Reference-grade open-back headphones designed for mixing and mastering. Ultra-flat frequency response with handcrafted 50mm beryllium drivers.",
    specs: {
      "Driver Size": "50mm Beryllium",
      "Impedance": "300 ohms",
      "Frequency": "5Hz - 50kHz",
      "Type": "Open-back",
      "Cable": "Detachable 3m OFC",
      "Weight": "340g"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p5",
    name: "Bass Cannon Earbuds",
    category: "Audio",
    price: 89,
    originalPrice: 119,
    image: "assets/images/products/earbuds_bass.jpg",
    badge: null,
    rating: 4.5,
    reviews: 2200,
    description: "Extra bass-tuned earbuds with punchy low-end and clear mids. Perfect for workouts with secure wing-tip design and IPX7 waterproofing.",
    specs: {
      "Driver Size": "10mm",
      "Battery": "10h + 30h case",
      "Bass": "Extra Bass Technology",
      "Connectivity": "Bluetooth 5.2",
      "Weight": "6.2g per bud",
      "Water Resistance": "IPX7"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p6",
    name: "SoundBar Ultra",
    category: "Audio",
    price: 399,
    originalPrice: null,
    image: "assets/images/products/soundbar_ultra.jpg",
    badge: "new",
    rating: 4.6,
    reviews: 670,
    description: "Cinematic 7.1.4 surround sound from a single bar. Dolby Atmos, DTS:X, and wireless subwoofer included. Transform your living room.",
    specs: {
      "Channels": "7.1.4",
      "Output": "520W",
      "Codecs": "Dolby Atmos, DTS:X",
      "Connectivity": "HDMI eARC, WiFi, BT",
      "Subwoofer": "Wireless Included",
      "Dimensions": "1200 x 60 x 100mm"
    },
    inStock: true,
    featured: false
  },

  // ── WEARABLES ──
  {
    id: "p7",
    name: "Titan Smartwatch",
    category: "Wearables",
    price: 299,
    originalPrice: null,
    image: "assets/images/products/smartwatch_titan.jpg",
    badge: "new",
    rating: 4.8,
    reviews: 1800,
    description: "Advanced health monitoring with ECG, SpO2, and body temperature tracking. Always-on AMOLED display, 14-day battery, and 100+ workout modes.",
    specs: {
      "Display": "1.43\" AMOLED",
      "Battery": "14 days",
      "Health": "ECG, SpO2, Temp",
      "Water Resistance": "5ATM + IP68",
      "GPS": "Dual-band GPS",
      "Storage": "32GB Music"
    },
    inStock: true,
    featured: true
  },
  {
    id: "p8",
    name: "FitBand Ultra",
    category: "Wearables",
    price: 79,
    originalPrice: 99,
    image: "assets/images/products/fitband_ultra.jpg",
    badge: "sale",
    rating: 4.4,
    reviews: 4500,
    description: "Lightweight fitness tracker with heart rate monitoring, sleep analysis, and 21-day battery life. Your daily health companion.",
    specs: {
      "Display": "1.1\" AMOLED",
      "Battery": "21 days",
      "Health": "HR, Sleep, SpO2",
      "Water Resistance": "5ATM",
      "Weight": "26g",
      "Straps": "Interchangeable"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p9",
    name: "Chrono Luxe Watch",
    category: "Wearables",
    price: 499,
    originalPrice: 649,
    image: "assets/images/products/chrono_luxe.jpg",
    badge: "hot",
    rating: 4.9,
    reviews: 920,
    description: "Premium titanium smartwatch with sapphire crystal display. Luxury meets technology with classic analog design and full smart features.",
    specs: {
      "Display": "1.5\" Sapphire AMOLED",
      "Body": "Grade 5 Titanium",
      "Battery": "10 days",
      "Health": "Full Suite + ECG",
      "Navigation": "Multi-GNSS",
      "Water Resistance": "10ATM"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p10",
    name: "Smart Ring Aura",
    category: "Wearables",
    price: 349,
    originalPrice: null,
    image: "assets/images/products/smart_ring_aura.jpg",
    badge: "new",
    rating: 4.6,
    reviews: 560,
    description: "Discreet health tracking in a premium titanium ring. Monitors sleep, heart rate, body temperature, and activity — no screen needed.",
    specs: {
      "Material": "Titanium",
      "Battery": "7 days",
      "Health": "HR, Temp, HRV, SpO2",
      "Water Resistance": "100m",
      "Weight": "4-6g",
      "Sizes": "6-13"
    },
    inStock: true,
    featured: false
  },

  // ── PERIPHERALS ──
  {
    id: "p11",
    name: "Apex RGB Keyboard",
    category: "Peripherals",
    price: 179,
    originalPrice: null,
    image: "assets/images/products/keyboard.png",
    badge: null,
    rating: 4.6,
    reviews: 982,
    description: "Hot-swappable mechanical keyboard with per-key RGB, gasket-mount design, and south-facing LEDs. Premium PBT keycaps included.",
    specs: {
      "Switches": "Hot-swap Mechanical",
      "Keycaps": "PBT Double-shot",
      "Backlight": "Per-key RGB",
      "Layout": "75%",
      "Connectivity": "USB-C, 2.4GHz, BT",
      "Battery": "4000mAh"
    },
    inStock: true,
    featured: true
  },
  {
    id: "p12",
    name: "Stealth Gaming Mouse",
    category: "Peripherals",
    price: 79,
    originalPrice: null,
    image: "assets/images/products/mouse_stealth.jpg",
    badge: null,
    rating: 4.7,
    reviews: 3400,
    description: "Ultra-lightweight 58g gaming mouse with 26K DPI sensor, optical switches, and 80-hour battery. Designed for competitive FPS players.",
    specs: {
      "Sensor": "26,000 DPI",
      "Weight": "58g",
      "Switches": "Optical",
      "Battery": "80 hours",
      "Polling Rate": "4000Hz",
      "Connectivity": "2.4GHz + BT"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p13",
    name: "Precision Mousepad XL",
    category: "Peripherals",
    price: 49,
    originalPrice: null,
    image: "assets/images/products/mousepad_xl.jpg",
    badge: null,
    rating: 4.5,
    reviews: 1800,
    description: "Extended desk mat with micro-textured surface for precise tracking. Anti-slip rubber base and stitched edges for durability.",
    specs: {
      "Size": "900 x 400 x 4mm",
      "Surface": "Micro-woven Cloth",
      "Base": "Anti-slip Rubber",
      "Edges": "Stitched",
      "Thickness": "4mm",
      "Compatibility": "All Sensors"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p14",
    name: "StreamDeck Controller",
    category: "Peripherals",
    price: 149,
    originalPrice: 199,
    image: "assets/images/products/streamdeck.jpg",
    badge: "sale",
    rating: 4.8,
    reviews: 2100,
    description: "15 customizable LCD keys for streaming, productivity, and smart home control. Drag-and-drop setup with plugin ecosystem.",
    specs: {
      "Keys": "15 LCD (72x72 px)",
      "Connectivity": "USB-C",
      "Compatibility": "Win/Mac",
      "Profiles": "Unlimited",
      "Stand": "Adjustable",
      "Plugins": "200+ integrations"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p15",
    name: "Webcam 4K Ultra",
    category: "Peripherals",
    price: 199,
    originalPrice: null,
    image: "assets/images/products/webcam_4k.jpg",
    badge: "new",
    rating: 4.7,
    reviews: 890,
    description: "4K30 / 1080p60 webcam with AI-powered auto-framing, noise-cancelling mic, and adjustable field of view. Studio quality for meetings.",
    specs: {
      "Resolution": "4K @ 30fps",
      "FOV": "65° / 78° / 90°",
      "Autofocus": "AI Auto-frame",
      "Mic": "Dual Omnidirectional",
      "Mount": "Monitor + Tripod",
      "HDR": "Yes"
    },
    inStock: true,
    featured: false
  },

  // ── COMPUTING ──
  {
    id: "p16",
    name: "UltraBook Pro 16",
    category: "Computing",
    price: 1499,
    originalPrice: 1799,
    image: "assets/images/products/laptop_ultrabook.jpg",
    badge: "hot",
    rating: 4.9,
    reviews: 4200,
    description: "M4 Pro chip with 18-core GPU, 16\" Liquid Retina XDR display, 22-hour battery, and 36GB unified memory. The ultimate creative workstation.",
    specs: {
      "Chip": "M4 Pro 14-core",
      "Memory": "36GB Unified",
      "Storage": "1TB SSD",
      "Display": "16.2\" XDR 3456x2234",
      "Battery": "22 hours",
      "Weight": "2.14kg"
    },
    inStock: true,
    featured: true
  },
  {
    id: "p17",
    name: "Gaming Laptop Fury",
    category: "Computing",
    price: 1899,
    originalPrice: 2199,
    image: "assets/images/products/laptop_gaming.jpg",
    badge: "sale",
    rating: 4.8,
    reviews: 1600,
    description: "RTX 5080 with 240Hz QHD display. Intel i9-14900HX, 32GB DDR5, vapor chamber cooling, and per-key RGB. Dominate every game.",
    specs: {
      "GPU": "RTX 5080 12GB",
      "CPU": "i9-14900HX",
      "RAM": "32GB DDR5",
      "Display": "16\" QHD 240Hz",
      "Storage": "2TB NVMe Gen5",
      "Cooling": "Vapor Chamber"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p18",
    name: "Mini Desktop Hub",
    category: "Computing",
    price: 699,
    originalPrice: null,
    image: "assets/images/products/mini_pc.jpg",
    badge: null,
    rating: 4.6,
    reviews: 780,
    description: "Compact powerhouse with desktop-class performance. M4 chip, dual monitor support, and whisper-quiet fan-less design.",
    specs: {
      "Chip": "M4 10-core",
      "Memory": "24GB Unified",
      "Storage": "512GB SSD",
      "Ports": "5x USB-C, 2x USB-A, HDMI",
      "Displays": "Up to 3 monitors",
      "Design": "Fanless"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p19",
    name: "Portable SSD 4TB",
    category: "Computing",
    price: 249,
    originalPrice: 329,
    image: "assets/images/products/ssd_portable.jpg",
    badge: "sale",
    rating: 4.7,
    reviews: 3200,
    description: "Blazing-fast 2000MB/s portable storage. IP65 water and dust resistant, drop-proof to 3m, hardware encryption built-in.",
    specs: {
      "Capacity": "4TB",
      "Speed": "2000 MB/s",
      "Interface": "USB 3.2 Gen 2x2",
      "Protection": "IP65, 3m drop",
      "Encryption": "256-bit AES",
      "Weight": "92g"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p20",
    name: "4K Monitor UltraWide",
    category: "Computing",
    price: 799,
    originalPrice: 999,
    image: "assets/images/products/monitor_ultrawide.jpg",
    badge: "hot",
    rating: 4.8,
    reviews: 1400,
    description: "34\" curved ultrawide with nano-IPS, 165Hz, 1ms, HDR600. USB-C 96W charging, built-in KVM switch. One cable workstation.",
    specs: {
      "Size": "34\" 21:9 Curved",
      "Resolution": "3440 x 1440",
      "Panel": "Nano-IPS",
      "Refresh": "165Hz",
      "HDR": "HDR600",
      "USB-C": "96W PD + KVM"
    },
    inStock: true,
    featured: false
  },
  // ── EXTRA PRODUCTS ──
  {
    id: "p21",
    name: "Wireless Charger Pad",
    category: "Peripherals",
    price: 39,
    originalPrice: null,
    image: "assets/images/products/charger_wireless.jpg",
    badge: null,
    rating: 4.4,
    reviews: 5600,
    description: "15W fast wireless charging pad compatible with all Qi devices. Sleek aluminum design with LED indicator and foreign object detection.",
    specs: {
      "Output": "15W / 10W / 7.5W",
      "Standard": "Qi2",
      "Material": "Aluminum + Silicone",
      "Safety": "FOD, OVP, OTP",
      "Cable": "USB-C 1.5m",
      "Compatibility": "All Qi devices"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p22",
    name: "GaN Charger 140W",
    category: "Peripherals",
    price: 69,
    originalPrice: 89,
    image: "assets/images/products/charger_gan.jpg",
    badge: null,
    rating: 4.6,
    reviews: 2800,
    description: "Pocket-sized 140W GaN charger with 3 ports. Charge your laptop, phone, and tablet simultaneously. 50% smaller than standard adapters.",
    specs: {
      "Output": "140W Total",
      "Ports": "2x USB-C, 1x USB-A",
      "Technology": "GaN III",
      "Protocols": "PD 3.1, QC 5.0",
      "Size": "68 x 38 x 34mm",
      "Weight": "152g"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p23",
    name: "USB-C Hub 12-in-1",
    category: "Peripherals",
    price: 59,
    originalPrice: null,
    image: "assets/images/products/usb_c_hub.jpg",
    badge: null,
    rating: 4.5,
    reviews: 1900,
    description: "Everything hub with dual HDMI, Ethernet, SD/microSD, 3x USB-A, 2x USB-C (100W PD), and 3.5mm audio. Aluminum unibody.",
    specs: {
      "Ports": "12 total",
      "Video": "Dual HDMI 4K@60Hz",
      "Data": "3x USB-A 3.0",
      "PD": "100W pass-through",
      "Ethernet": "Gigabit RJ45",
      "Material": "CNC Aluminum"
    },
    inStock: true,
    featured: false
  },
  {
    id: "p24",
    name: "Noise Machine Sleep",
    category: "Audio",
    price: 59,
    originalPrice: null,
    image: "assets/images/products/noise_machine.jpg",
    badge: null,
    rating: 4.8,
    reviews: 6200,
    description: "Premium white noise machine with 35 soothing sounds. Adaptive volume, sleep timer, and compact travel-friendly design for perfect rest.",
    specs: {
      "Sounds": "35 built-in",
      "Timer": "Auto-off 30/60/90min",
      "Volume": "Adaptive ambient",
      "Power": "USB-C / Battery",
      "Battery": "12 hours",
      "Size": "80mm diameter"
    },
    inStock: true,
    featured: false
  }
];

// Export for Node (so server can require this file). This will be ignored in browsers.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
}
