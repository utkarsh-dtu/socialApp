import { Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { resetPassword } from "../../Actions/User";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const dispatch = useDispatch();
  const alert = useAlert();
  const params = useParams();

  const submitHandler = async (e) => {
    e.preventDefault();
    dispatch(resetPassword(params.token, newPassword));
  };
  const { error, loading, message } = useSelector((state) => state.like);

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
    <div className="resetPassword">
      <form className="resetPasswordForm" onSubmit={submitHandler}>
        <Typography variant="h3" style={{ padding: "2vmax" }}>
          Social Aap
        </Typography>

        <input
          type="password"
          placeholder="New Password"
          className="resetPasswordInputs"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <Link to="/">
          <Typography>Login</Typography>
        </Link>

        <Typography>Or</Typography>
        <Link to="/forgot/password">
          <Typography>Request another token!</Typography>
        </Link>

        <Button type="submit" disabled={loading}>
          Reset Password
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
