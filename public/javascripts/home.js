
  // Helper function to get a cookie by name
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Redirect function
  function redirectBasedOnLogin() {
    const token = getCookie('token'); // replace 'token' with your actual cookie name
    if (token) {
      window.location.href = '/profile';  // or your create post route
    } else {
      window.location.href = '/login';
    }
  }


