const express = require('express')
const app = express()
const port = process.env.PORT || 3000

// cors and express.json use as a middleware and require dotenv.config()

app.get('/', (req, res) => {
  res.send('BookStack is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})