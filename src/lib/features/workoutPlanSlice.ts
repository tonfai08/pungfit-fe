import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getMyWorkoutPlan, type WorkoutPlan } from "@/lib/api/workout";

type WorkoutPlanState = {
  data: WorkoutPlan | null;
  loading: boolean;
  error: string | null;
};

const initialState: WorkoutPlanState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchWorkoutPlan = createAsyncThunk(
  "workoutPlan/fetch",
  async () => {
    const data = await getMyWorkoutPlan();
    return data;
  }
);

const workoutPlanSlice = createSlice({
  name: "workoutPlan",
  initialState,
  reducers: {
    clearWorkoutPlan(state) {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkoutPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkoutPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchWorkoutPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch workout plan.";
      });
  },
});

export const { clearWorkoutPlan } = workoutPlanSlice.actions;
export default workoutPlanSlice.reducer;
