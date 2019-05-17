import React, { Component } from "react";
import { Helmet } from "react-helmet";
import Feed from "./Feed";
import Chats from "./Chats";
import SearchBar from "./components/bar";
import { UserProvider } from './components/context/user';

import "./components/fontawesome";
import "../../assets/css/style.css";
export default class App extends Component {
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
					<SearchBar/>
					<Feed />
					<Chats />
				</UserProvider>
			</div>
		);
	}
}
