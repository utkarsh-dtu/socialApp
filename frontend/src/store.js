import { configureStore } from "@reduxjs/toolkit";
import { likeReducer, myPostReducer, userPostsReducer } from "./Reducers/Post";
import {
  allUsersReducer,
  postOfFollowingReducer,
  userProfileReducer,
  userReducer,
} from "./Reducers/User";

const store = configureStore({
  reducer: {
    user: userReducer,
    postOfFollowing: postOfFollowingReducer,
    allUsers: allUsersReducer,
    like: likeReducer,
    myPosts: myPostReducer,
    userProfile: userProfileReducer,
    userPosts: userPostsReducer,
  },
});

export default store;
