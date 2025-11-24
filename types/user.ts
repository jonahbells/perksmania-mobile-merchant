export type Merchant = {
    _id: string;
    business_name: string;
    owners_name: string;
    business_category: {
      _id: string;
      business: string;
    } | null;
    region: string;
    province: string;
    city: string;
    barangay: string;
    office_address: string;
    office_contact: string;
    zipcode: string;
    email: string;
    contact_person: string;
    social_media: string | null;
    markerter_id: string;
    password: string;
    is_activated: boolean;
    verification_status: string;
    activation_code: string;
    merchant_code: string;
    creation_date: {
      $date: string;
    };
    location: string | null;
    logoimage: string | null;
    update_date: {
      $date: string;
    };
    registration_number: string;
    membership_plan: string;
  };

  export interface Customer {
    _id: string;
    lastname: string;
    firstname: string;
    email: string;
    contact: string;
    activation_code: string;
    is_activated: boolean;
    partnercode: string | null;
    agentcode: string | null;
    merchantcode: string | null;
    creation_date: string; // ISO date string
    membership_no: string;
    resetcode: string;
    emailVerified: boolean;
    provider?: 'email' | 'google' | 'facebook';
    profile_image: string | null;
    perks_points: number;
    total_points_earned: number;
  }
  