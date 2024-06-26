"use client"
import {useCallback, useEffect} from "react";
import {useTelegram} from "@/providers/telegram-provider";
import {useAppContext} from "@/providers/context-provider";
import StoreFront from "@/components/store-front";
import OrderOverview from "@/components/order-overview";
import ProductOverview from "@/components/product-overview";
import { log } from "console";

export default function Home() {
    const {webApp, user,} = useTelegram()
    const {state, dispatch} = useAppContext()

    const handleCheckout = useCallback(async () => {
        console.log("checkout!")
        webApp?.MainButton.showProgress()
        const invoiceSupported = webApp?.isVersionAtLeast('6.1');
        const items = Array.from(state.cart.values()).map((item) => ({
            id: item.product.id,
            count: item.count
        }))
        const body = JSON.stringify({
            userId: user?.id,
            chatId: webApp?.initDataUnsafe.chat?.id,
            //get customer user 
            invoiceSupported,
            comment: state.comment,
            shippingZone: state.shippingZone,
            items
        })

        try {
            const res = await fetch("api/orders", {method: "POST", body})
            const result = await res.json()

            if (invoiceSupported) {
                webApp?.openInvoice(result.invoice_link, function (status) {
                    webApp?.MainButton.hideProgress()
                    if (status == 'paid') {
                        console.log("[paid] InvoiceStatus " + result);
                        webApp?.close();
                    } else if (status == 'failed') {
                        console.log("[failed] InvoiceStatus " + result);
                        webApp?.HapticFeedback.notificationOccurred('error');
                    } else {
                        console.log("[unknown] InvoiceStatus" + result);
                        webApp?.HapticFeedback.notificationOccurred('warning');
                    }
                });
            } else {
                webApp?.showAlert("Some features not available. Please update your telegram app!")
            }
        } catch (_) {
            webApp?.showAlert("Some error occurred while processing order!")
            webApp?.MainButton.hideProgress()
        }


    }, [webApp, state.cart, state.comment, state.shippingZone])

    // useEffect(() => {
    //     const callback = state.mode === "order" ? handleCheckout :
    //         () => dispatch({type: "order"})
    //     webApp?.MainButton.setParams({
    //         text_color: '#fff',
    //         color: '#31b545',
    //         text:"ادامه"
    //     }).onClick(callback)
    //     webApp?.BackButton.onClick(() => dispatch({type: "storefront"}))
    //     return () => {
    //         //prevent multiple call
    //         webApp?.MainButton.offClick(callback)
    //     }
    // }, [webApp, state.mode, handleCheckout])
    useEffect(() => {
        const callback = state.mode === "order" ? handleCheckout : () => {
            webApp?.MainButton.setParams({
                text_color: '#fff',
                color: '#31b545',
                text: "برای ادامه شماره تلفن خود را با ما به اشتراک بزارید"
            });
    
            // Request the user's contact information
            webApp?.MainButton.onClick(() => {


                webApp?.requestContact((contact) => {
                    // @ts-ignore
                    if (contact ) {
                        // @ts-ignore
                        console.log('User phone number:', contact)
                        // Here you can dispatch an action or call a function to handle the phone number

                        webApp?.onEvent('contactRequested', function(event) {
                            // Handle contactRequested event here
                            if (event.status === 'sent') {
                                // @ts-ignore
                                var decodedResponse = decodeURIComponent(event.response);

                                // Parse the decoded response into a JavaScript object
                                var parsedResponse = JSON.parse(decodedResponse);
                            
                                // Extract the phone number from the parsed response
                                var phoneNumber = parsedResponse.contact.phone_number;
                            
                                console.log('User shared phone number:', phoneNumber)
                            } else if (event.status === 'cancelled') {
                                // User declined to share phone number
                                console.log('User declined to share phone number');
                            }
                        });

                    }
                });
            });
        };
    
        webApp?.MainButton.setParams({
            text_color: '#fff',
            color: '#31b545',
            text: "ادامه"
        }).onClick(callback);
    
        webApp?.BackButton.onClick(() => dispatch({ type: "storefront" }));
    
        return () => {
            // Prevent multiple calls
            webApp?.MainButton.offClick(callback);
        };
    }, [webApp, state.mode, handleCheckout]);

    useEffect(() => {
        if (state.mode === "storefront")
            webApp?.BackButton.hide()
        else
            webApp?.BackButton.show()

        if (state.mode === "order")
            webApp?.MainButton.setText("تسویه حساب")
        else
            webApp?.MainButton.setText("مشاهده سفارش")
    }, [state.mode])

    useEffect(() => {
        if (state.cart.size !== 0) {
            webApp?.MainButton.show()
            webApp?.enableClosingConfirmation()
        } else {
            webApp?.MainButton.hide()
            webApp?.disableClosingConfirmation()
        }
    }, [state.cart.size])

    return (
        <main className={`${state.mode}-mode`}>
            <StoreFront/>
            <ProductOverview/>
            <OrderOverview/>
        </main>
    )
}
