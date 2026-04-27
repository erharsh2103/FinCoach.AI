import PhoneAuth from "./PhoneAuth";

export function AuthFlow({ onLogin }) {
  return <PhoneAuth onLogin={onLogin} />;
}

export default AuthFlow;
