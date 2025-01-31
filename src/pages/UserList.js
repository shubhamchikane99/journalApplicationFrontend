import React from "react";
import "../styles/UserList.css";

const UserList = ({ users, selectUser }) => {
  return (
    <div className="user-list">
      <h2>Users</h2>
      {users.map((user, index) => (
        <div key={index} className="user-item" onClick={() => selectUser(user.id)}>
          {user.userName}
        </div>
      ))}
    </div>
  );
};

export default UserList;
