import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
  id: decodedToken.userId,
  role: decodedToken.role,
  mustChangePassword: Boolean(decodedToken.mustChangePassword),
};

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}