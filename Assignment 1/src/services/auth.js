export function isAuthenticated() {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}')
  return auth.isAuthenticated || false
}

export function currentUser() {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}')
  return auth.user || null
}

export function currentRole() {
  const user = currentUser()
  return user?.role || null
}

export function login(user) {
  const auth = {
    isAuthenticated: true,
    user: user
  }
  localStorage.setItem('auth', JSON.stringify(auth))
}

export function logout() {
  localStorage.removeItem('auth')
}

export function setUserRole(role) {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}')
  if (auth.user) {
    auth.user.role = role
    localStorage.setItem('auth', JSON.stringify(auth))
  }
}
