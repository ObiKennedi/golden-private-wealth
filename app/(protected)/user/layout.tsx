import Nav from "@/components/user/Nav";
import Script from 'next/script'
import "@/styles/user/layout.scss";

const UserDashboardLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="user-layout">
            <Nav />
            <div className="user-layout__main">
                <div className="user-layout__content">
                    {children}
                </div>
            </div>
            <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
        </div>
    );
};

export default UserDashboardLayout;