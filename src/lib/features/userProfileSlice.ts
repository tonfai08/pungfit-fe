import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getUserProfile } from "@/lib/api/auth";
export type UserProfile = {
  email?: string;
  display_name?: string;
  last_login?: string;
  profile_image?: string;
  weight_kg?: number | string;
  height_cm?: number | string;
  body_fat_percent?: number | string;
  gender?: string;
  age?: number | string;
  bmr?: number | string;
  activity_level?: string;
  tdee?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  };
};
type UserProfileState = {
  data: UserProfile | null;
  loading: boolean;
  error: string | null;
};
const initialState: UserProfileState = {
  data: null,
  loading: false,
  error: null,
};
const persistUserProfile = (data: UserProfile) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    "userProfile",
    JSON.stringify({
      email: data.email || "",
      display_name: data.display_name || "",
      last_login: data.last_login || "",
      profile_image: data.profile_image || "",
    })
  );
  localStorage.setItem(
    "userBody",
    JSON.stringify({
      weight: data.weight_kg || "",
      height: data.height_cm || "",
      bodyFat: data.body_fat_percent || "",
      gender: data.gender || "",
      age: data.age || "",
      bmr: data.bmr || "",
      activity_level: data.activity_level || "",
      tdee: data.tdee || null,
    })
  );
};
export const fetchUserProfile = createAsyncThunk(
  "userProfile/fetch",
  async () => {
    const data = await getUserProfile();
    persistUserProfile(data);
    return data as UserProfile;
  }
);
const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    clearUserProfile(state) {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user profile.";
      });
  },
});
export const { clearUserProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;
