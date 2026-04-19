export default async function handler(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: 'generateLesson route working',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message,
    });
  }
}
