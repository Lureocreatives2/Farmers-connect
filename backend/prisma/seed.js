/**
 * Farmers Connect — Database Seed
 * Run: npm run db:seed
 *
 * Creates sample farmers and product listings for
 * development and testing.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("\n🌿 Seeding Farmers Connect database…\n");

  // Clean slate for dev
  await prisma.product.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.user.deleteMany();
  console.log("  ✓ Cleared existing data");

  // ── Farmers ──────────────────────────────────────────
  const farmersData = [
    { name:"Emeka Okafor",   phone:"08012345678", farmName:"Okafor Green Farms",     state:"Anambra", verified:true  },
    { name:"Fatima Aliyu",   phone:"07098765432", farmName:"Aliyu Agro Estate",      state:"Kano",    verified:true  },
    { name:"Bola Adeyemi",   phone:"09011223344", farmName:"Adeyemi Family Farm",    state:"Oyo",     verified:false },
    { name:"Chukwudi Nwosu", phone:"08033445566", farmName:"Nwosu Organic Farms",    state:"Enugu",   verified:true  },
    { name:"Aisha Mohammed", phone:"08122334455", farmName:"Sahel Fresh Produce",    state:"Kaduna",  verified:false },
  ];

  const farmers = [];
  for (const fd of farmersData) {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name:fd.name, phone:fd.phone, role:"FARMER" },
      });
      const farmer = await tx.farmer.create({
        data: { userId:user.id, farmName:fd.farmName, state:fd.state, verified:fd.verified },
        include: { user:true },
      });
      return farmer;
    });
    farmers.push(result);
    console.log(`  ✓ Registered: ${fd.name} (${fd.farmName})`);
  }

  // ── Products ──────────────────────────────────────────
  const products = [
    // Emeka — Anambra
    { farmerId:farmers[0].id, name:"Fresh Roma Tomatoes",  category:"VEGETABLES", price:5500,  unit:"crate",    status:"APPROVED", description:"Firm, ripe Roma tomatoes harvested this week from our greenhouse in Anambra. Perfect for stew, soups, and sauces. No pesticides used — 100% organic. Minimum order 2 crates.", imageUrl:"https://images.unsplash.com/photo-1546094096-0df4bcaad337?w=800" },
    { farmerId:farmers[0].id, name:"White Maize (Corn)",   category:"GRAINS",     price:24000, unit:"50kg bag", status:"APPROVED", description:"Sun-dried white maize, properly stored and pest-free. Ideal for grinding into flour, animal feed, or industrial use. Available in large quantities. Minimum 2 bags.", imageUrl:"https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800" },

    // Fatima — Kano
    { farmerId:farmers[1].id, name:"Large Red Onions",     category:"VEGETABLES", price:14000, unit:"50kg bag", status:"APPROVED", description:"Premium large red onions from our 5-acre farm in Kano. Firm, pungent, and long shelf life. Perfect for restaurants, market traders, and households. Bulk discounts available for 10+ bags.", imageUrl:"https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800" },
    { farmerId:farmers[1].id, name:"Grade A Groundnuts",   category:"LEGUMES",    price:18000, unit:"50kg bag", status:"APPROVED", description:"Freshly harvested and sun-dried groundnuts. Shelled, sorted by size, and free of mold. Ideal for oil extraction, suya spice production, and confectioneries. Delivery available in Kano.", imageUrl:"https://images.unsplash.com/photo-1506484381205-f7945653044d?w=800" },
    { farmerId:farmers[1].id, name:"Sorghum (Guinea Corn)",category:"GRAINS",     price:19000, unit:"50kg bag", status:"PENDING", description:"Clean, dry sorghum grain — ideal for flour, animal feed, and local brewing. Harvested November 2024 and properly stored in our dry warehouse. Contact for bulk pricing.", imageUrl:"" },

    // Bola — Oyo
    { farmerId:farmers[2].id, name:"Premium Puna Yam",     category:"TUBERS",     price:3800,  unit:"tuber",    status:"APPROVED", description:"Large, fresh Puna yam tubers from Oyo State. Each tuber weighs 2–4kg. Ideal for pounded yam, yam porridge, boiled yam, and yam chips. Freshly harvested, no bruising. Minimum order 10 tubers.", imageUrl:"https://images.unsplash.com/photo-1572439491893-b34f1d005f72?w=800" },
    { farmerId:farmers[2].id, name:"Ripe Plantain Bunches",category:"FRUITS",     price:4200,  unit:"bunch",    status:"APPROVED", description:"Sweet, heavy plantain bunches from our plantation. Both ripe (for dodo) and unripe (for boli and chips) available. Each bunch has 10–14 fingers. Order today for same-week delivery in Ibadan and Oyo.", imageUrl:"https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800" },
    { farmerId:farmers[2].id, name:"Fresh Cassava Tubers",  category:"TUBERS",     price:2500,  unit:"basket",   status:"PENDING",  description:"Sweet cassava ready for processing into garri, fufu, or starch. Harvested fresh and delivered within 48 hours. Baskets weigh approximately 30kg. Larger orders welcome.", imageUrl:"" },

    // Chukwudi — Enugu
    { farmerId:farmers[3].id, name:"Waterleaf (Talinum)",  category:"VEGETABLES", price:1200,  unit:"bunch",    status:"APPROVED", description:"Fresh waterleaf picked same-day from our farm in Enugu. A must-have for Edikaikong, afang soup, and native stews. Sold in large bunches. Order before 8am for same-day delivery.", imageUrl:"https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800" },
    { farmerId:farmers[3].id, name:"Palm Fruit (Fresh Bunch)",category:"OTHER",   price:6500,  unit:"bunch",    status:"APPROVED", description:"Heavy fresh palm fruit bunches from our plantation in Enugu. Perfect for palm oil extraction and banga soup. Each bunch weighs 15–25kg. Available weekly — contact to reserve your bunch.", imageUrl:"https://images.unsplash.com/photo-1601055283742-8b27e81b5553?w=800" },

    // Aisha — Kaduna
    { farmerId:farmers[4].id, name:"Brown Honey Beans",    category:"LEGUMES",    price:22000, unit:"50kg bag", status:"APPROVED", description:"Clean, dry honey beans (oloyin) from Kaduna. Soft-cooking variety perfect for moi moi, akara, and porridge. Hand-sorted to remove stones and bad beans. Wholesale pricing for 5+ bags.", imageUrl:"https://images.unsplash.com/photo-1497534446932-c925b458314e?w=800" },
    { farmerId:farmers[4].id, name:"Tiger Nuts (Ofio)",    category:"OTHER",      price:8500,  unit:"10kg bag", status:"FLAGGED",   description:"Dried tiger nuts from Kaduna. Perfect for tigernut milk (kunu aya) and healthy snacks. Clean, sorted, and properly dried. Minimum 2 bags.", imageUrl:"" },
  ];

  let approved = 0, pending = 0;
  for (const pd of products) {
    await prisma.product.create({ data: pd });
    if (pd.status === "APPROVED") approved++;
    else pending++;
  }
  console.log(`\n  ✓ Created ${products.length} products (${approved} approved, ${pending} pending/flagged)`);

  // ── Summary ───────────────────────────────────────────
  console.log("\n✅ Database seeded successfully!\n");
  console.log("Farmer IDs for testing:");
  farmers.forEach((f) => console.log(`  • ${f.user.name.padEnd(20)} → ${f.id}`));
  console.log("\nDefault admin credentials:");
  console.log("  Username: admin");
  console.log("  Password: farmersconnect2024\n");
}

main()
  .catch((e) => { console.error("\n❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
