import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);
//we are initializing the cart value to be 0   
//giving it a range till 300 approx
const getDefaultCart = () => {
    let cart = {};
    for (let index = 0; index < 300 + 1; index++) {
        cart[index] = 0;
    }
    return cart;
}

const ShopContextProvider = (props) => {
    const [all_product, setAll_Product] = useState([]);
    const [cartItems, setCartItems] = useState(getDefaultCart());
    const [lastAddedProductId, setLastAddedProductId] = useState(null);
// useeffect - hook , this fetches all products from my backend and updates the all_product state
// dependency arr is [], so runs only once  
useEffect(() => {
    // fectching from backend
        fetch('http://https://petsy-new-repo.onrender.com/allproducts')
            .then((response) => response.json())
            .then((data) => setAll_Product(data))
             // nw fetching cart items if authenticated
            if(localStorage.getItem('auth-token')){
                fetch('http://https://petsy-new-repo.onrender.com/getcart',{
                    method:'POST',
                    headers:{
                        Accept:'application/form-data',
                        'auth-token':`${localStorage.getItem('auth-token')}`,
                        'Content-Type': 'application/json',
                    },
                    body:"",
                }).then((response)=>response.json())
                .then((data)=>setCartItems(data));
            }
    }, []);

    const addToCart = (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
        setLastAddedProductId(itemId); // Set the last added product ID
        if (localStorage.getItem('auth-token')) {
            fetch('http://https://petsy-new-repo.onrender.com/addtocart', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'auth-token':`${localStorage.getItem('auth-token')}` ,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemId }),
            }).then((response) => response.json())
            .then((data) => console.log(data));
        }
    };

    const removeFromCart = (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
        if(localStorage.getItem('auth-token')){
            fetch('http://https://petsy-new-repo.onrender.com/removefromcart', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'auth-token':`${localStorage.getItem('auth-token')}` ,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemId }),
            })
            .then((response) => response.json())
            .then((data) => console.log(data));
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = all_product.find((product) => product.id === Number(item));
                totalAmount += itemInfo.new_price * cartItems[item];
            }
        }
        return totalAmount;
    }

    const getTotalCartItems = () => {
        let totalItem = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                totalItem += cartItems[item];
            }
        }
        return totalItem;
    }


    const contextValue = { getTotalCartItems, getTotalCartAmount, all_product, cartItems, addToCart, removeFromCart };

    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
            {lastAddedProductId && (
                <div>
                    Last product added to cart: {lastAddedProductId}
                </div>
            )}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;

