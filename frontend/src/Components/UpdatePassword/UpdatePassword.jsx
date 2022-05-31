import React, { useEffect, useState } from "react";

import "./UpdatePassword.css";

import { useDispatch, useSelector } from "react-redux";

import { Typography, Button } from "@mui/material";
import { updatePassword } from "../../Actions/User";
import { useAlert } from "react-alert";

function UpdatePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const dispatch = useDispatch();

  const alert = useAlert();
  const { error, loading, message } = useSelector((state) => state.like);

  const submitHandler = async (e) => {
    e.preventDefault();
    await dispatch(updatePassword(oldPassword, newPassword));
    setOldPassword("");
    setNewPassword("");
  };

  useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch({ type: "clearErrors" });
    }

    if (message) {
      alert.success(message);
      dispatch({ type: "clearMessage" });
    }
  }, [dispatch, alert, error, message]);

  return (
    <div className="updatePassword">
      <form className="updatePasswordForm" onSubmit={submitHandler}>
        <Typography variant="h3" style={{ padding: "2vmax" }}>
          Social Aap
        </Typography>

        <input
          type="password"
          placeholder="Old Password"
          required
          className="updatePasswordInputs"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          className="updatePasswordInputs"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <Button type="submit" disabled={loading}>
          Change Password
        </Button>
      </form>
    </div>
  );
}

export default UpdatePassword;
