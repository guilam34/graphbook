import React, { Component } from "react";
import { Helmet } from "react-helmet";
import Feed from "./Feed";
import Chats from "./Chats";
import SearchBar from "./components/bar";
import { UserProvider } from "./components/context/user";
import LoginRegisterForm from "./components/loginregister";

import "./components/fontawesome";
import "../../assets/css/style.css";
export default class App extends Component {
	state = {
		loggedIn: false
	};
	componentWillMount() {
		const token = localStorage.getItem("jwt");
		if (token) {
			this.setState({ loggedIn: true });
		}
	}
	changeLoginState = loggedIn => {
		this.setState({ loggedIn });
	};
	render() {
		return (
			<div className="container">
				<Helmet>
					<title>Graphbook - Feed</title>
					<meta
						name="description"
						content="Newsfeed of all your
                       friends on Graphbook"
					/>
				</Helmet>
				<UserProvider>
					{this.state.loggedIn ? (
						<div>
							<SearchBar />
							<Feed />
							<Chats />
						</div>
					) : (
						<LoginRegisterForm changeLoginState={this.changeLoginState} />
					)}
				</UserProvider>
			</div>
		);
	}
}
