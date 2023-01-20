import React from 'react'
import { useContext } from 'react'
import { AuthContext } from "../contexts/AuthContext";
import { toast } from 'react-hot-toast';
import PassCard from '../components/PassCard'
import goldMark from '../assets/icons/Gold_mark.svg'
import silverMark from '../assets/icons/Silver_mark.svg'
import bronzeMark from '../assets/icons/Bronze_mark.svg'
import comboMark from '../assets/icons/Combo_mark.svg'
import combo2Mark from '../assets/icons/Combo2_mark.svg'
import djMark from '../assets/icons/Dj_mark.svg'

function BuyPass() {

    const { currentUser } = useContext(AuthContext);

    const serverURL = import.meta.env.VITE_SERVER_URL;

    const passes = [
        {
            id: "PS-G",
            name: "GOLD",
            markImg: goldMark,
            price: 300,
            features: [
                "Access to All Events (INERTIA & SWOOSH)",
                "Access to All Guest Lectures",
                "Access to Zingaat : Cultural Events",
                "500 Digital Wallet Points"
            ],
            color: "#FFDF00"
        },
        {
            id: "PS-S",
            name: "SILVER",
            markImg: silverMark,
            price: 250,
            features: [
                "Access to any 3 Events (INERTIA & SWOOSH)",
                "Access to any 2 Guest Lectures",
                "Access to Zingaat : Cultural Events",
                "300 Digital Wallet Points"
            ],
            color: "#C0C0C0"
        },
        {
            id: "PS-B",
            name: "BRONZE",
            markImg: bronzeMark,
            price: 200,
            features: [
                "Access to any 2 Events (INERTIA & SWOOSH)",
                "Access to any 1 Guest Lecture",
                "Access to Zingaat : Cultural Events",
                "100 Digital Wallet Points"
            ],
            color: "#CD7F32"
        },
        {
            id: "PS-DJ",
            name: "ATMOS",
            markImg: djMark,
            price: 450,
            features: [
                "A night to groove on EDM beats. A spectacle not to MISS OUT!"
            ],
            color: "#88D20F"
        },
        {
            id: "PS-C1",
            name: "COMBO",
            markImg: comboMark,
            price: 550,
            features: [
                "All benefits of GOLD & ATMOS Pass"
            ],
            color: "#FFDF00"
        },
        {
            id: "PS-C2",
            name: "COMBO+",
            markImg: combo2Mark,
            price: 550,
            features: [
                "Access to all workshop & ATMOS Pass"
            ],
            color: "#4B9DFD"
        }
    ]

<<<<<<< HEAD

=======
>>>>>>> 5350fcc2a91bf20c67ed2e926f1fc47b0a7e2767
    const isDate = val => Object.prototype.toString.call(val) === '[object Date]'

    const isObj = val => typeof val === 'object'

    const stringifyValue = val => isObj(val) && !isDate(val) ? JSON.stringify(val) : val

    function buildForm({ action, params }) {
        const form = document.createElement('form')
        form.setAttribute('method', 'post')
        form.setAttribute('action', action)

        Object.keys(params).forEach(key => {
<<<<<<< HEAD
            console.log(params)
=======
>>>>>>> 5350fcc2a91bf20c67ed2e926f1fc47b0a7e2767
            const input = document.createElement('input')
            input.setAttribute('type', 'hidden')
            input.setAttribute('name', key)
            input.setAttribute('value', stringifyValue(params[key]))
            form.appendChild(input)
        })

        return form
    }

    function post(details) {
        const form = buildForm(details)
        document.body.appendChild(form)
        form.submit()
        form.remove()
    }

    const getData = (data) => {

        return fetch(`${serverURL}/api/get-payment-info`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }).then(response => response.json()).catch(err => console.log(err))
    }



    const makePayment = (amt, clientEmail) => {
        getData({ amount: amt.toString(), email: clientEmail }).then(response => {

            console.log(response);

            let information = {
                action: "https://securegw-stage.paytm.in/order/process",
                params: response
            }
            post(information)
        })
    }

<<<<<<< HEAD
    // lifting state up
=======

>>>>>>> 5350fcc2a91bf20c67ed2e926f1fc47b0a7e2767
    async function handleBuyClick(passCode) {

        if (currentUser == null) window.location.href = "/login";

        let profile = localStorage.getItem("profile")
        if (profile == '{}') window.location.href = "/profile";

        profile = JSON.parse(profile)
        const PID = profile.ParticipantID

        const res = await fetch(serverURL + "/api/secure/pass/buy/check", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + currentUser.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ passCode, PID }),
        });
        const check = await res.json();
        const amt = await check.payAmount

<<<<<<< HEAD
        if (check.message == "Profile Not Completed") {
            window.location.href = "/profile";
        } else if (check.message == "Buying First Pass" || check.message == "Upgrade Pass") {
            makePayment(amt, profile.Email, passCode);

            // const res = await fetch(serverURL + "/api/secure/pass/buy", {
            //     method: "POST",
            //     headers: {
            //         Authorization: "Bearer " + currentUser["accessToken"],
            //         "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify({ PID, passCode, amt }),
            // });
            // const data = await res.json();
            // console.log(data);
        } else if (check.type === 'error') { 
            toast.error(check.message, { duration: 3000 });
        }
=======
        if (check.type === "error") {
            toast.error(check.message, { duration: 3000 })
        } else {
            makePayment(amt, profile.Email)
        }



        // if (check.message == "Profile Not Completed") {
        //     window.location.href = "/profile";
        // } else if (check.message == "Buying First Pass") {
        //     const res = await fetch(serverURL + "/api/secure/pass/buy", {
        //         method: "POST",
        //         headers: {
        //             Authorization: "Bearer " + currentUser["accessToken"],
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify({ PID, passCode, amt }),
        //     });
        //     const data = await res.json();
        //     console.log(data);
        // } else if (check.message == "Same Pass") {
        // } else if (check.message == "Remove Registered Events & Guest Lectures") {
        // } else if (check.message == "Can't Downgrade Pass") {
        // } else if (check.message == "Remove Registered Workshops") {
        // } else if (check.message == "Event&Guest/Upgrade") {
        //     const res = await fetch(serverURL + "/api/secure/pass/buy", {
        //         method: "POST",
        //         headers: {
        //             Authorization: "Bearer " + currentUser["accessToken"],
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify({ PID, passCode, amt }),
        //     });
        //     const data = await res.json();
        //     console.log(data);
        // } else if (check.message == "Event&Guest/C2") {
        //     const res = await fetch(serverURL + "/api/secure/pass/buy", {
        //         method: "POST",
        //         headers: {
        //             Authorization: "Bearer " + currentUser["accessToken"],
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify({ PID, passCode, amt }),
        //     });
        //     const data = await res.json();
        //     console.log(data);
        // } else if (check.message == "Event&Guest/DJ") {
        //     const res = await fetch(serverURL + "/api/secure/pass/buy", {
        //         method: "POST",
        //         headers: {
        //             Authorization: "Bearer " + currentUser["accessToken"],
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify({ PID, passCode, amt }),
        //     });
        //     const data = await res.json();
        //     console.log(data);
        // } else if (check.message == "Combos") {
        //     const res = await fetch(serverURL + "/api/secure/pass/buy", {
        //         method: "POST",
        //         headers: {
        //             Authorization: "Bearer " + currentUser["accessToken"],
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify({ PID, passCode, amt }),
        //     });
        //     const data = await res.json();
        //     console.log(data);
        // }
>>>>>>> 5350fcc2a91bf20c67ed2e926f1fc47b0a7e2767
    }

    return (
        // <div className='flex flex-wrap justify-center items-center gap-8 my-16'>
        <div className='max-w-[1200px] m-auto grid grid-cols-1 md:grid-cols-2 md:gap-y-8 lg:grid-cols-3 place-items-center my-16'>
            {
                passes.map((pass, index) => <PassCard buyClick={handleBuyClick} passInfo={pass} key={index} />)
            }
        </div>
    )
}

export default BuyPass