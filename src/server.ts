import app from "./app.js";
import dotenv from "dotenv";
import { testConnection } from "./config/supabase.js";

dotenv.config();

const PORT: string | number = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();