<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="header">
        <h2>Tricity Urban Survey</h2>
        <p>Authorized Personnel Access</p>
      </div>
      
      <div class="auth-section">
        <button @click="handleGoogleLogin" class="google-btn" :disabled="loading">
          <div class="g-logo-wrapper">
            <svg class="g-logo" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"></path>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"></path>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"></path>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.159 6.656 3.58 9 3.58z" fill="#EA4335"></path>
            </svg>
          </div>
          <span class="btn-text">Sign in with Google</span>
        </button>
      </div>

      <div class="footer">
        <p>System v3.0 | Secure Connection</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase';

const loading = ref(false);

async function handleGoogleLogin() {
  loading.value = true;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) {
    alert('Authentication Failed');
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  font-family: 'Segoe UI', Roboto, sans-serif;
}
.login-card {
  background: white;
  padding: 40px;
  width: 100%;
  max-width: 380px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
}
.header h2 { margin: 0 0 10px; color: #1a1a1a; font-weight: 600; }
.header p { margin: 0; color: #666; font-size: 0.9em; }
.auth-section { margin: 30px 0; }
.google-btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; background: white; border: 1px solid #dadce0;
  border-radius: 4px; padding: 10px; cursor: pointer;
  transition: background-color 0.2s;
}
.google-btn:hover { background-color: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.g-logo-wrapper { width: 18px; height: 18px; margin-right: 12px; }
.btn-text { color: #3c4043; font-weight: 500; font-size: 14px; }
.footer { border-top: 1px solid #eee; padding-top: 20px; color: #999; font-size: 0.75em; }
</style>