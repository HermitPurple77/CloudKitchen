// Staff API endpoint for tests
app.get('/api/staff', (req, res) => {
  res.json([
    { name: "Priya Kumar", role: "Head Chef", status: "Online", last_seen: "2026-03-30" },
    { name: "Deepak Mehra", role: "Grill Station", status: "Offline", last_seen: "2026-03-29" },
    { name: "Tulsi Rao", role: "Delivery Lead", status: "Online", last_seen: "2026-03-30" }
  ]);
});