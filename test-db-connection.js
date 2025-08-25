const mongoose = require("mongoose");

// MongoDB connection
const MONGODB_URI =
  "mongodb+srv://delightbessie:K2YggcWeWJZwE9An@cluster0.a5atplx.mongodb.net/news_scraping?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully!");

    // Test if articles collection exists and has data
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name)
    );

    // Check articles collection
    const articlesCollection = mongoose.connection.db.collection("articles");
    const articleCount = await articlesCollection.countDocuments();
    console.log(`📰 Total articles in database: ${articleCount}`);

    if (articleCount > 0) {
      // Get sample articles by category
      const categories = [
        "Politics",
        "Sports",
        "Entertainment",
        "Business",
        "General",
      ];

      for (const category of categories) {
        const count = await articlesCollection.countDocuments({ category });
        console.log(`  - ${category}: ${count} articles`);
      }

      // Get latest 3 articles
      const latestArticles = await articlesCollection
        .find({ isActive: true, status: "published" })
        .sort({ publishDate: -1 })
        .limit(3)
        .toArray();

      console.log("\n📋 Latest 3 articles:");
      latestArticles.forEach((article, index) => {
        console.log(
          `  ${index + 1}. ${article.title} (${article.category}) - ${new Date(article.publishDate).toLocaleDateString()}`
        );
      });
    }

    await mongoose.connection.close();
    console.log("✅ Database connection test completed successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();
