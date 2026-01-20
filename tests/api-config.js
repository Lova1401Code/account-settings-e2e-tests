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

export const searchCustomerByEmail = async (email) => {
  const response = await fetch(`${API_BASE_URL}/customer/search?query=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to search customer: ${error.message || response.status}`);
  }
  
  return response.json();
};

export const deleteCustomer = async (customerId) => {
  const response = await fetch(`${API_BASE_URL}/customer/delete/${customerId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to delete customer: ${error.message || response.status}`);
  }
  
  return response.json();
};

export const cleanupTestUser = async (email) => {
  try {
    const searchResult = await searchCustomerByEmail(email);
    if (searchResult.count > 0 && searchResult.customers[0]?.id) {
      await deleteCustomer(searchResult.customers[0].id);
      console.log(`Deleted test user: ${email}`);
    }
  } catch (error) {
    console.log(`Cleanup failed for ${email}:`, error.message);
  }
};
