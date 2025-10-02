// to extract the id from the auth property useing auth provided in the clerkmiddleware
export const protect = (req, res, next) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authenticated" });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
