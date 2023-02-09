import React, { useState, Fragment, useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-hot-toast";
import profilePic from "../assets/photos/profile.jpg";
import uniList from "../data/uniList.json";
import YourEvent from "../components/YourEvent";
import { Dialog, Transition } from "@headlessui/react";
import { HiQrcode } from "react-icons/hi";
import { QRCode } from "react-qrcode-logo";
import a_logo from "../assets/icons/a_logo.png";
import Gold from "../assets/passes/Gold.png";
import Silver from "../assets/passes/Silver.png";
import Bronze from "../assets/passes/Bronze.png";
import DJ from "../assets/passes/DJ.png";
import Combo from "../assets/passes/Combo.png";
import Passes from "./../assets/Passes.json";

function Pro() {
	const { currentUser, profile, setProfile } = useContext(AuthContext);
	let email_ = currentUser.email;

	const serverURL = import.meta.env.VITE_SERVER_URL;

	const [canEdit, setCanEdit] = useState(false);

	const [pid, setPid] = useState("");
	const [fName, setFName] = useState("");
	const [lName, setLName] = useState("");
	const [email, setEmail] = useState("");
	const [contactNo, setContactNo] = useState("");
	const [branch, setBranch] = useState("");
	const [uniName, setUniName] = useState("");
	const [gender, setGender] = useState("");
	const [city, setCity] = useState("");

	const [txnStatus, setTxnStatus] = useState("");
	const [passCode, setPassCode] = useState("");
	const [passType, setPassType] = useState("");
	const [passColor, setPassColor] = useState("");
	const [passImg, setPassImg] = useState("");

	const [registeredEvents, setRegisteredEvents] = useState([]);

	// Modal Stuff
	const [isOpen, setIsOpen] = useState(false);
	const [isView, setIsView] = useState(false);
	const [modalColor, setModalColor] = useState("#c22727");

	const [reloadEvents, setReloadEvents] = useState(false);

	const [eventCode, setEventCode] = useState("");
	const [selectedEventType, setSelectedEventType] = useState("");
	const [selectedEventName, setSelectedEventName] = useState("");
	const [color, setColor] = useState("");
	const [teamID, setTeamID] = useState("");
	const [teamName, setTeamName] = useState("");
	const [isSolo, setIsSolo] = useState(false);
	const [role, setRole] = useState("");

	let allEvents = [];

	useEffect(() => {
		setEmail(currentUser.email);

		if (profile != {}) {
			// const pro = JSON.parse(profile);
			if (profile.ProfileStatus === 1) {
				updateProfile(profile);
				setCanEdit(false);
			} else {
				setCanEdit(true);
			}
		} else {
			setCanEdit(true);
		}
		console.log();
	}, [profile]);

	useEffect(() => {
		const fetchEvents = async () => {
			const data = await fetch(serverURL + "/api/secure/getEvents", {
				method: "POST",
				headers: {
					Authorization: "Bearer " + currentUser.accessToken,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email_ }),
			});
			const fetchdata = await data.json();

			Passes.passes.map((element) => {
				if (element["id"] == profile.PassCode) {
					setPassType(element["name"]);
					setPassColor(element["color"]);
					setPassImg(element["markImg"]);
					console.log(passImg);
				}
			});
			if (fetchdata.type == "success") {
				allEvents = [];
				fetchdata.data.solo.forEach((data) => {
					allEvents.push(data);
					setRegisteredEvents(allEvents);
				});
				fetchdata.data.team.forEach((data) => {
					allEvents.push(data);
					setRegisteredEvents(allEvents);
				});
			}
		};

		fetchEvents();
		console.log(registeredEvents);
	}, [reloadEvents]);

	function updateProfile(pro) {
		let date = new Date(pro.DOB);
		let year = date.getFullYear();
		let month = (date.getMonth() + 1).toString().padStart(2, "0");
		let dt = date.getDate().toString().padStart(2, "0");
		const dtStr = year + "-" + month + "-" + dt;

		setPid(pro.ParticipantID);
		setFName(pro.Firstname);
		setLName(pro.Lastname);
		setContactNo(pro.ContactNo);
		setBranch(pro.Branch);
		setUniName(pro.University);
		setGender(pro.Gender);
		setCity(pro.City);

		setTxnStatus(pro.TxnStatus);
		setPassCode(pro.PassCode);
	}

	function handleSubmit(e) {
		// console.log(e)
		e.preventDefault();
		setCanEdit(false);

		if (!currentUser) return;

		currentUser.getIdToken().then((token) => {
			fetch(serverURL + "/api/secure/update-profile", {
				method: "POST",
				headers: {
					Authorization: "Bearer " + token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fName,
					lName,
					contactNo,
					uniName,
					branch,
					gender,
					city,
				}),
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.type === "success") {
						fetch(serverURL + "/api/secure/get-profile", {
							headers: {
								Authorization: "Bearer " + token,
								"Content-Type": "application/json",
							},
						})
							.then((res) => res.json())
							.then((data) => {
								toast.success("Profile updated successfully!");
								setProfile(data.message);
							})
							.catch((err) => {
								toast.error("Error updating profile!");
								setProfile({});
							})
							.finally(() => {
								setCanEdit(false);
								updateProfile(data.message);
							});
					} else {
						setCanEdit(true);
					}
				})
				.catch((err) => {
					// console.log(err);
					setCanEdit(true);
				});
		});
	}

	async function handleDeleteEvent() {
		const unregister = await fetch(serverURL + "/api/secure/deleteEvent", {
			method: "POST",
			headers: {
				Authorization: "Bearer " + currentUser.accessToken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				pid,
				eventCode,
				isSolo,
				role,
				teamID,
			}),
		});

		const info = await unregister.json();
		// console.log(info)
		if (info.type == "success") {
			toast.success(info.message, { duration: 3000 });
		} else {
			toast.error(info.message, { duration: 3000 });
		}
		closeModal();
		setReloadEvents(!reloadEvents);
		console.log(registeredEvents.length);
		if (registeredEvents.length == 1) {
			window.location.href = "profile";
		}
	}

	function deleteEvent(info, color) {
		setIsOpen(true);
		setIsView(false);
		setColor(color);
		setModalColor("border-red-600");
		setSelectedEventName(info.EventName);
		setSelectedEventType(info.EventType);
		setEventCode(info.EventCode);

		if (info.HeadCount > 1) {
			setIsSolo(false);
			setRole(info.Role);
			setTeamID(info.TeamID);
		} else {
			setIsSolo(true);
			setRole("");
			setTeamID("");
		}
	}

	function infoEvent(info, color) {
		console.log(info);

		setIsOpen(true);
		setIsView(true);
		setColor(color);
		setModalColor("border-black");
		setSelectedEventName(info.EventName);
		setSelectedEventType(info.EventType);
		setEventCode(info.EventCode);
		setTeamName(info.TeamName);

		if (info.HeadCount > 1) {
			setIsSolo(false);
			setRole(info.Role);
			setTeamID(info.TeamID);
		} else {
			setIsSolo(true);
			setRole("");
			setTeamID("");
		}
	}

	function closeModal() {
		setIsOpen(false);
	}

	return (
		<div className="flex-col my-5 justify-center items-center w-full h-max px-4 lg:py-10 bg-white lg:px-40">
			<div className="my-10 sm:mt-0">
				<div className="md:grid-cols-4 gap-4">
					<div className="flex border border-[#78BDC4] border-b-[#022539] flex-col bg-white sm:flex-row flex-wrap">
						<div className="flex grow p-6 justify-center sm:justify-start">
							<div className="flex-none flex flex-col justify-center">
								<img
									src={profile.ProfileImg}
									className="z-10 h-24 w-24 rounded-full"
									alt={profilePic}
								/>
							</div>
							<div className="flex flex-none flex-col justify-center items-left p-4">
								<div className="flex flex-row text-xl font-semibold">

									{profile.Firstname + " " + profile.Lastname}
								</div>
								<div className="text-xs">{profile.Email}</div>
								<div>
									<button
										className="px-4 py-1 mt-2 shadow text-[#1C7690] rounded-md bg-white hover:bg-[#1C7690] hover:text-white"
										onClick={() => signOut(auth)}
									>
										Sign Out
									</button>
								</div>
							</div>
						</div>
						<div className="flex grow-0 flex-row sm:flex-col bg-primary-dark-2 text-white justify-center items-center">
							{txnStatus != "TXN_SUCCESS" ? (
								<div className="mx-10">
									<button
										className='relative border border-[var(bg-primary-light-1)] before:content-[""] before:absolute before:w-full before:h-full before:top-0 before:bg-gradient-to-r before:from-transparent before:to-transparent before:via-primary-light-1 before:-left-full before:hover:left-full before:transition-all before:duration-500 hover:shadow-lg hover:shadow-primary-light-1 transition-all overflow-hidden py-2 px-8 bg-gradient-to-b from-primary-dark-1 to-primary-dark-2 text-white rounded-md w-full inline-flex items-center justify-center py-1 h-12 rounded-md bg-primary-dark-2 text-white flex-wrap'
										onClick={(_) => {
											window.location.href = "/buypass";
										}}
									>
										Buy&nbsp;Pass
									</button>
								</div>
							) : (
								<>
									<div className="flex flex-1 w-full">
										<div className="ml-6 mb-4 flex-none">
											<img
												src={`/src/assets/passes/${passImg}`}
												className="w-13"
												alt=""
											/>
										</div>
										<div className="flex-none flex flex-col mt-6 ml-4 mr-6">
											<label
												className={`text-3xl font-semibold text-[${passColor}]-900`}
											>
												{passType}
											</label>
											<button className="bg-amber-50 text-xs hover:bg-[#fff]-400 text-gray-800 font-bold py-1 px-2.5 rounded inline-flex items-center">
												<svg
													className="fill-current w-3 h-3 mr-1"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
												>
													<path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
												</svg>
												<span>&nbsp;Download</span>
											</button>
										</div>
									</div>
									<div className="flex flex-col flex-1 text-xs w-full text-right px-4">
										<div className="flex-none flex flex-row justify-end items-center ">
											<div className="flex-none mb-1 w-min">
												Max&nbsp;Events Access
											</div>
											<div className="flex-none text-xl ml-2 p-1 px-2 text-black font-semibold rounded-md bg-primary-light-3 mb-1">
												4
											</div>
										</div>
										<div className="flex-none flex flex-row justify-end items-center mb-3">
											<div className="flex-none mb-1 w-min">
												Max&nbsp;Guests Access
											</div>
											<div className="flex-none text-xl ml-2 p-1 px-2 text-black font-semibold rounded-md bg-primary-light-3 mb-1">
												2
											</div>
										</div>
									</div>
								</>
							)}
						</div>

						<div className="flex grow justify-end p-4 bg-primary-light-3 border">
							<div className="grow flex flex-col my-auto flex-none pl-1">
								<div className="flex-1 flex flex-col text-left lg:text-right">
									<div className="flex-none text-xs">
										Digital Points
									</div>
									<div className="flex-none text-3xl">
										{profile.DigitalPoints}
									</div>
								</div>
								<div className="flex-none flex flex-col text-left lg:text-right">
									<div className="flex-none text-xs">
										Total Event Registered
									</div>
									<div className="flex-none text-xl">
										5
									</div>
								</div>
								<div className="flex-none flex flex-col text-left lg:text-right">
									<div className="flex-none text-xs">
										Total Guests Registered
									</div>
									<div className="flex-none text-xl">
										2
									</div>
								</div>
							</div>

							<div className="flex-none">
								<div className="col-span-1 bg-primary-light-3 flex-none justify-between items-center ">
									<QRCode
										value={pid}
										size={145}
										logoImage={a_logo}
										qrStyle={"dots"}
										logoOpacity={1}
										logoHeight={40}
										logoWidth={40}
										eyeRadius={[
											{
												// top/left eye
												outer: [0, 20, 10, 20],
												inner: [10, 10, 10, 10],
											},
											{
												// top/left eye
												outer: [20, 0, 20, 10],
												inner: [10, 10, 10, 10],
											},
											{
												// top/left eye
												outer: [20, 10, 20, 0],
												inner: [10, 10, 10, 10],
											},
										]}
										eyeColor={[
											{
												outer: "#1C7690",
												inner: "black",
											},
											{
												outer: "#1C7690",
												inner: "black",
											},
											{
												outer: "#1C7690",
												inner: "black",
											},
										]}
										bgColor={"#FFFFFF00"}
										ecLevel={"H"}
									/>
								</div>
							</div>
						</div>
					</div>

					
				</div>

				<div className="mt-0 md:col-span-3 md:mt-0">
					<form onSubmit={handleSubmit}>
						<div className="overflow-hidden shadow">
							<div className="bg-primary-dark-2 px-4 py-3 flex justify-between items-center sm:px-6">
								<h1 className="font-bold justify-center text-[#F2FFFE]">
									Personal Details
								</h1>
								<button
									onClick={(e) => {
										e.preventDefault();
										setCanEdit(!canEdit);
									}}
									className="inline-flex items-center justify-center py-1 px-5 h-1/4 rounded-md bg-primary-light-3 hover:bg-primary-light-2 text-dark shadow-inner"
								>
									{canEdit ? "Cancel" : "Edit"}
								</button>
							</div>
							<div className="bg-primary-light-3 border border-[#78BDC4] border-t-[#022539] px-4 py-5 sm:p-6">
								<div className="grid grid-cols-6 gap-6">
									<div className="col-span-6 sm:col-span-3 md:col-span-2">
										<label
											htmlFor="first-name"
											className="block text-sm font-medium text-gray-700 bg-primary-light-3"
										>
											First name
										</label>
										<input
											type="text"
											autoComplete="given-name"
											placeholder="First Name"
											disabled={!canEdit}
											required
											value={fName}
											onChange={(e) => {
												setFName(e.target.value);
											}}
											className="disabled:text-gray-500 disabled:bg-primary-light-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-dark-1 focus:ring-primary-dark-1 sm:text-sm"
										/>
									</div>

									<div className="col-span-6 sm:col-span-3 md:col-span-2">
										<label
											htmlFor="last-name"
											className="block text-sm font-medium text-gray-700"
										>
											Last name
										</label>
										<input
											type="text"
											autoComplete="family-name"
											disabled={!canEdit}
											required
											placeholder="Last Name"
											value={lName}
											onChange={(e) => {
												setLName(e.target.value);
											}}
											className="disabled:text-gray-500 disabled:bg-primary-light-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-dark-1 focus:ring-primary-dark-1 sm:text-sm"
										/>
									</div>

									<div className="col-span-6 sm:col-span-3 md:col-span-2">
										<label
											htmlFor="email-address"
											className="block text-sm font-medium text-gray-700"
										>
											Email address
										</label>
										<input
											type="text"
											autoComplete="email"
											disabled={true}
											required
											placeholder="Email"
											value={email}
											onChange={(e) => {
												setEmail(e.target.value);
											}}
											className="disabled:text-gray-500 disabled:bg-primary-light-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-dark-1 focus:ring-primary-dark-1 sm:text-sm"
										/>
									</div>

									<div className="col-span-6 sm:col-span-3 md:col-span-2">
										<label
											htmlFor="email-address"
											className="block text-sm font-medium text-gray-700"
										>
											Contact No.
										</label>
										<input
											type="tel"
											placeholder="Contact No"
											disabled={!canEdit}
											required
											pattern="[0-9]{10}"
											value={contactNo}
											onChange={(e) => {
												setContactNo(e.target.value);
											}}
											className="disabled:text-gray-500 disabled:bg-primary-light-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-dark-1 focus:ring-primary-dark-1 sm:text-sm"
										/>
									</div>

									<div className="col-span-6 sm:col-span-3 md:col-span-2">
										<label
											htmlFor="country"
											className="block text-sm font-medium text-gray-700"
										>
											Gender
										</label>
										<select
											required
											disabled={!canEdit}
											value={gender}
											onChange={(e) => {
												setGender(e.target.value);
											}}
											className="disabled:text-gray-500 disabled:bg-primary-light-3 mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-primary-dark-1 focus:outline-none focus:ring-primary-dark-1 sm:text-sm"
										>
											<option value="">
												Select Gender
											</option>
											<option value="Male">Male</option>
											<option value="Female">
												Female
											</option>
										</select>
									</div>

									<div className="col-span-6 sm:col-span-3 md:col-span-2">
										<label
											htmlFor="city"
											className="block text-sm font-medium text-gray-700"
										>
											City
										</label>
										<input
											type="text"
											autoComplete="address-level2"
											placeholder="City"
											required
											disabled={!canEdit}
											value={city}
											onChange={(e) => {
												setCity(e.target.value);
											}}
											className="disabled:text-gray-500 disabled:bg-primary-light-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-dark-1 focus:ring-primary-dark-1 sm:text-sm"
										/>
									</div>

									<div className="col-span-6 sm:col-span-3 md:col-span-3">
										<label
											htmlFor="country"
											className="block text-sm font-medium text-gray-700"
										>
											University
										</label>
										<select
											disabled={!canEdit}
											value={uniName}
											onChange={(e) => {
												setUniName(e.target.value);
											}}
											className="disabled:text-gray-500 disabled:bg-primary-light-3 mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-primary-dark-1 focus:outline-none focus:ring-primary-dark-1 sm:text-sm"
											required
										>
											<option selected value="">
												Select University
											</option>
											{uniList.map((uni, index) => {
												return (
													<option
														key={index}
														value={uni}
													>
														{uni}
													</option>
												);
											})}
										</select>
									</div>

									<div className="col-span-6 sm:col-span-3 md:col-span-3">
										<label
											htmlFor="email-address"
											className="block text-sm font-medium text-gray-700"
										>
											Branch / Course
										</label>
										<input
											type="text"
											placeholder="Branch"
											required
											disabled={!canEdit}
											value={branch}
											onChange={(e) => {
												setBranch(e.target.value);
											}}
											className="disabled:text-gray-500 disabled:bg-primary-light-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-dark-1 focus:ring-primary-dark-1 sm:text-sm"
										/>
									</div>
								</div>
							</div>
							{canEdit && (
								<div className="bg-primary-dark-2 px-4 py-3 text-right sm:px-6">
									<button className="inline-flex items-center justify-center py-1 px-5 h-1/4 rounded-md bg-primary-light-3 text-dark hover:bg-primary-light-2">
										Save
									</button>
								</div>
							)}
						</div>
					</form>
				</div>

				<hr className="my-10" />

				<div className="md:grid md:grid-cols-4 md:gap-6">
					<div className="mt-5 md:col-span-4 md:mt-0">
						<div className="overflow-hidden shadow rounded-md py-5">
							<div className="bg-primary-light-2 mb-5 px-4 py-3 flex justify-between items-center sm:px-6">
								<h1 className="font-bold text-xl text-dark justify-center m-auto">
									Your Events
								</h1>
							</div>
							{registeredEvents.length > 0 ? (
								registeredEvents.map((data, index) => (
									<YourEvent
										data={data}
										deleteEvent={deleteEvent}
										infoEvent={infoEvent}
										key={index}
									/>
								))
							) : (
								<div className="bg-white px-4 py-5 sm:p-6">
									<div className="bg-white shadow px-4 py-3 flex justify-between items-center sm:px-6">
										<div className="justify-center">
											<label className="block text-lg font-medium text-gray-700">
												No Event Found
											</label>
											<label
												htmlFor="first-name"
												className="block text-xs font-extralight text-gray-700"
											></label>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<Transition appear show={isOpen} as={Fragment}>
				<Dialog as="div" className="relative z-10" onClose={closeModal}>
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-black bg-opacity-25" />
					</Transition.Child>

					<div className="fixed inset-0 overflow-y-auto">
						<div className="flex min-h-full items-center justify-center p-4 text-center">
							<Transition.Child
								as={Fragment}
								enter="ease-out duration-300"
								enterFrom="opacity-0 scale-95"
								enterTo="opacity-100 scale-100"
								leave="ease-in duration-200"
								leaveFrom="opacity-100 scale-100"
								leaveTo="opacity-0 scale-95"
							>
								<Dialog.Panel
									className={`w-full max-w-md transform overflow-hidden rounded-2xl bg-white px-10 py-6 text-left align-middle shadow-xl transition-all border-y-4 ${modalColor} bg-white`}
								>
									<Dialog.Title
										as="h3"
										className="text-center text-lg font-medium leading-6 text-gray-900 mb-6"
									>
										<div className="text-center">
											<label
												className={`text-xs font-medium mr-2 px-1.5 py-0.5 rounded bg-${color}-100 text-${color}-800`}
											>
												{selectedEventType}
											</label>
											<label className="block text-3xl font-medium text-gray-700">
												{selectedEventName}
											</label>
											{!isSolo && <>(3/5)</>}
										</div>
									</Dialog.Title>
									{!isView ? (
										// Deletion of Event --------------------------------

										<>
											<div className="mt-2">
												<p className="text-center text-sm text-gray-500 mb-6">
													{isSolo ? (
														<>
															<label className="bb-6">
																By doing this,
																you might not
																register in this
																event if event
																got full...
															</label>
															<br />
															<br />
															<label>
																Do you want to
																continue?
															</label>
														</>
													) : role == "Leader" ? (
														<>
															<label className="mb-6">
																Unregistering
																yourself means
																you are remove
																your team from
																the event which
																includes all
																team members and
																you might not
																register in this
																event if event
																got full...
															</label>
															<br />
															<br />
															<label>
																Do you want to
																continue?
															</label>
														</>
													) : (
														<>
															<label className="mb-6">
																By doing this,
																you might not
																register in this
																event if event
																got full...
															</label>
															<br />
															<br />
															<label>
																Do you want to
																continue?
															</label>
														</>
													)}
												</p>
											</div>

											<div className="flex m-auto w-min">
												<div className="mx-4">
													<button
														type="button"
														className="mx-6 inline-flex justify-center rounded-md border border-transparent bg-[#DC3545] px-4 py-2 text-sm font-medium text-[#F2FFFE] hover:bg-[#db6e78] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#012C3D]-500 focus-visible:ring-offset-2"
														style={{
															margin: "auto",
														}}
														onClick={
															handleDeleteEvent
														}
													>
														Yes
													</button>
												</div>
												<div className="mx-4">
													<button
														type="button"
														className="mx-6 inline-flex justify-center rounded-md border border-transparent bg-[#012C3D] px-4 py-2 text-sm font-medium text-[#F2FFFE] hover:bg-[#1C7690] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#012C3D]-500 focus-visible:ring-offset-2"
														style={{
															margin: "auto",
														}}
														onClick={closeModal}
													>
														No
													</button>
												</div>
											</div>
										</>
									) : (
										// Information -------------------------------------
										<>
											<div className="mt-2">
												<p className="text-center justify-center text-sm text-gray-500 mb-6">
													{isSolo ? (
														<>
															<div className="col-span-6 sm:col-span-3">
																<label
																	htmlFor="first-name"
																	className="text-xs font-medium text-gray-700"
																>
																	Registration
																	Time
																</label>
																<input
																	type="text"
																	autoComplete="given-name"
																	placeholder="First Name"
																	disabled
																	required
																	value={
																		"11:00, 12 Feb 2023"
																	}
																	className="disabled:text-gray-500 disabled:bg-primary-light-3 m-auto text-center mt-1 block w-min rounded-md border-gray-300 shadow-sm focus:border-primary-dark-1 focus:ring-primary-dark-1 sm:text-sm"
																/>
															</div>
														</>
													) : (
														<div
															className={`drop-shadow-md bg-${color}-100 rounded-2xl py-5`}
														>
															<div className="col-span-6 sm:col-span-3 mb-2 mx-2">
																<label
																	htmlFor="first-name"
																	className="text-[0.8rem] block font-medium text-gray-700"
																>
																	Team Name
																</label>
																<label
																	htmlFor="first-name"
																	className="shadow-inner text-xl p-2 text-center m-auto bg-white block w-max px-5 mt-0.5 font-medium text-gray-700 rounded-lg "
																>
																	{teamName}
																</label>
															</div>
															<div className="col-span-6 sm:col-span-3 m-3">
																<label
																	htmlFor="first-name"
																	className="text-xs block font-medium text-gray-700"
																>
																	Team Leader
																</label>
																<label
																	htmlFor="first-name"
																	className="shadow-inner text-md p-2 text-center m-auto bg-white block w-max px-5 mt-0.5 font-bold text-gray-700 rounded-lg "
																>
																	Ashish Kumar
																	Patel
																</label>
															</div>
															<div className="col-span-6 sm:col-span-3 m-3">
																<label
																	htmlFor="first-name"
																	className="text-xs block font-medium text-gray-700"
																>
																	Registration
																	Time
																</label>
																<label
																	htmlFor="first-name"
																	className="shadow-inner text-sm p-2 text-center m-auto bg-white block w-max px-5 mt-0.5 font-medium text-gray-700 rounded "
																>
																	11:00 AM, 12
																	Feb 2023
																</label>
															</div>

															{role ==
																"Leader" && (
																<div
																	className={`drop-shadow-md bg-white mx-5 rounded-2xl py-2`}
																>
																	<label className="text-[0.8rem] block font-medium text-gray-700">
																		Members
																	</label>
																</div>
															)}
														</div>
													)}
												</p>
											</div>

											<div className="flex m-auto w-min">
												<div className="mx-4">
													<button
														type="button"
														className="shadow mx-6 text-[#1C7690] inline-flex justify-center rounded-md border border-[#1C7690] px-4 py-2 text-sm font-medium text-[#F2FFFE] hover:text-[#ffffff] hover:bg-[#1C7690] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#012C3D]-500 focus-visible:ring-offset-2"
														style={{
															margin: "auto",
														}}
														onClick={closeModal}
													>
														Close
													</button>
												</div>
											</div>
										</>
									)}
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition>
		</div>
	);
}

export default Pro;
