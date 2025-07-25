import { RegisterData } from '@/types/user';

export interface EmailRegistrationData {
  name: string;
  email: string;
  whatsapp: string;
  age: number;
  gender: string;
}

export const sendRegistrationEmail = async (userData: EmailRegistrationData): Promise<boolean> => {
  try {
    const response = await fetch('/.netlify/functions/send-registration-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to send registration email:', result.error);
      return false;
    }

    console.log('Registration email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending registration email:', error);
    return false;
  }
};