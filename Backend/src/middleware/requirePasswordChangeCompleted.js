export function requirePasswordChangeCompleted(req, res, next) {
  if (req.user.mustChangePassword) {
    return res.status(403).json({
      success: false,
      message: "You must change your temporary password before continuing",
      mustChangePassword: true,
    });
  }

  next();
}