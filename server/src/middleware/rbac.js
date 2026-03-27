export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user.memberships.map(m => m.role)
    const hasRole = allowedRoles.some(role => userRoles.includes(role))
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}