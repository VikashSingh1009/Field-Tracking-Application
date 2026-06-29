import React from 'react';
import LoginBranding from '../components/Auth/LoginBranding';
import LoginForm from '../components/Auth/LoginForm';

const Login = () => {
    return (

        <div className="h-screen overflow-hidden flex flex-col lg:flex-row">
            <LoginBranding />
            <LoginForm />
        </div>
    );
};

export default Login;























// import React from 'react';
// import LoginBranding from '../components/Auth/LoginBranding';
// import LoginForm from '../components/Auth/LoginForm';

// const Login = () => {
//     return (
//         <div className="min-h-screen flex flex-col lg:flex-row">
//             <LoginBranding />
//             <LoginForm />
//         </div>
//     );
// };

// export default Login;
