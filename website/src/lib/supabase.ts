import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have real Supabase credentials
const hasValidCredentials = supabaseUrl !== 'https://placeholder.supabase.co' && 
                          supabaseAnonKey !== 'placeholder-key';

export const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface EmailSubscription {
  id?: number;
  email: string;
  subscribed_at: string;
  is_active: boolean;
  language: 'greek' | 'english';
  source: 'website' | 'app' | 'other';
  user_agent?: string;
  ip_address?: string;
}

export const emailService = {
  async subscribeEmail(email: string, language: 'greek' | 'english' = 'greek'): Promise<{ success: boolean; message: string }> {
    // If Supabase is not configured, simulate success
    if (!supabase) {
      console.log('Supabase not configured, simulating email subscription:', email);
      return {
        success: true,
        message: language === 'greek' 
          ? 'Ευχαριστούμε! Θα σας ενημερώσουμε όταν το app είναι έτοιμο!' 
          : 'Thank you! We\'ll notify you when the app is ready!'
      };
    }

    try {
      // Check if email already exists
      const { data: existingEmail, error: checkError } = await supabase
        .from('email_subscriptions')
        .select('id, is_active')
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }

      if (existingEmail) {
        if (existingEmail.is_active) {
          return {
            success: false,
            message: language === 'greek' 
              ? 'Αυτό το email είναι ήδη εγγεγραμμένο!' 
              : 'This email is already subscribed!'
          };
        } else {
          // Reactivate subscription
          const { error: updateError } = await supabase
            .from('email_subscriptions')
            .update({ 
              is_active: true, 
              subscribed_at: new Date().toISOString(),
              language,
              source: 'website'
            })
            .eq('id', existingEmail.id);

          if (updateError) throw updateError;

          return {
            success: true,
            message: language === 'greek' 
              ? 'Ευχαριστούμε! Η εγγραφή σας ενεργοποιήθηκε ξανά!' 
              : 'Thank you! Your subscription has been reactivated!'
          };
        }
      }

      // Insert new subscription
      const { error: insertError } = await supabase
        .from('email_subscriptions')
        .insert({
          email,
          subscribed_at: new Date().toISOString(),
          is_active: true,
          language,
          source: 'website',
          user_agent: navigator.userAgent,
          ip_address: await this.getClientIP()
        });

      if (insertError) throw insertError;

      return {
        success: true,
        message: language === 'greek' 
          ? 'Ευχαριστούμε! Θα σας ενημερώσουμε όταν το app είναι έτοιμο!' 
          : 'Thank you! We\'ll notify you when the app is ready!'
      };

    } catch (error) {
      console.error('Email subscription error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'unknown',
        details: (error as any)?.details || 'No details available'
      });
      return {
        success: false,
        message: language === 'greek' 
          ? 'Σφάλμα κατά την εγγραφή. Παρακαλώ δοκιμάστε ξανά.' 
          : 'Error during subscription. Please try again.'
      };
    }
  },

  async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  },

  async getSubscriberCount(): Promise<number> {
    if (!supabase) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('email_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting subscriber count:', error);
      return 0;
    }
  }
};
