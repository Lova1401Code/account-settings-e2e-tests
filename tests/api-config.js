export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

export const getVerificationToken = async (customerId) => {
  const response = await fetch(`${API_BASE_URL}/mailer/test/get-verification-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to get verification token: ${error.message || response.status}`);
  }
  
  return response.json();
};
