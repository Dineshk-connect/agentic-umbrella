import 'dotenv/config'
import app from './src/app.js'

const PORT = process.env.PORT || 5000;

console.log("PORT VALUE:", process.env.PORT);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
