import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import userImg from '../assets/user.png';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IoSearchOutline } from "react-icons/io5";
import { navigation } from '../constants/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { token, user } = useSelector((state) => state.auth);

    const removeSpace = location?.search?.slice(3)?.split("%20")?.join(" ");
    const [searchInput, setSearchInput] = useState(removeSpace);

    useEffect(() => {
        if (searchInput) {
            navigate(`/search?q=${searchInput}`);
        }
    }, [searchInput, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    const handleAuthClick = () => {
        if (!token) {
            navigate('/auth');
        }
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    const handleFavoriteMovies = () => {
        navigate('/favorite-movies');
    };

    return (
        <header className="fixed top-0 w-full h-16 bg-neutral-600 bg-opacity-75 z-40">
            <div className="container mx-auto px-3 flex items-center h-full">
                <Link to="/">
                    <img src={logo} alt="Logo" width={120} />
                </Link>

                <nav className="hidden lg:flex items-center gap-1 ml-5">
                    {navigation.map((nav, index) => (
                        <div key={"Header" + index}>
                            <NavLink
                                key={nav.label}
                                to={nav.href}
                                className={({ isActive }) =>
                                    `px-2 hover:text-neutral-100 ${isActive ? "text-neutral-100" : "text-white"}`
                                }
                            >
                                {nav.label}
                            </NavLink>
                        </div>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-5">
                    <form className="flex items-center gap-2" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Search here..."
                            className="bg-transparent px-4 py-1 outline-none border-none hidden lg:block text-white placeholder-gray-400"
                            onChange={(e) => setSearchInput(e.target.value)}
                            value={searchInput}
                        />
                        <button className="text-2xl hidden lg:block text-white">
                            <IoSearchOutline />
                        </button>
                    </form>

                    {token ? (
                        <div className="group relative">
                            <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer active:scale-50 transition-transform duration-200">
                                <img src={userImg} alt="User" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute top-full right-0 mt-2 w-40 bg-neutral-700 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out delay-1000 z-50 group-hover:pointer-events-auto">
                                <button
                                    onClick={handleFavoriteMovies}
                                    className="block w-full text-left px-4 py-2 hover:bg-neutral-600"
                                >
                                    Favorite Movies
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 hover:bg-neutral-600"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleAuthClick}
                            className="text-white hover:text-gray-300 transition-colors duration-200"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;