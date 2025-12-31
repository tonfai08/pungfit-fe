import { configureStore } from "@reduxjs/toolkit";
import workoutPlanReducer from "@/lib/features/workoutPlanSlice";
import userProfileReducer from "@/lib/features/userProfileSlice";

export const store = configureStore({
  reducer: {
    workoutPlan: workoutPlanReducer,
    userProfile: userProfileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

