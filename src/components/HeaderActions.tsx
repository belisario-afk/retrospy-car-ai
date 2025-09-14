import React from "react";
import EnableWebPlayerButton from "./EnableWebPlayerButton";

const HeaderActions: React.FC = () => {
  return (
    <div className="flex gap-2">
      <EnableWebPlayerButton />
      {/* other header actions */}
    </div>
  );
};

export default HeaderActions;