const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const sendEmail = require('../utils/sendEmail'); 

// HELPER: Generate a guaranteed unique professional Order ID
const generateUniqueOrderId = async () => {
    let isUnique = false;
    let newOrderId = '';

    while (!isUnique) {
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        newOrderId = `TM-${randomString}`;
        const existingOrder = await Order.findOne({ orderId: newOrderId });
        if (!existingOrder) {
            isUnique = true;
        }
    }
    return newOrderId;
};

// =================================================================
// 1. CREATE ORDER (Sends "Order Confirmed" Invoice Email)
// =================================================================
exports.createOrder = async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // Calculate Delivery Deadline (Now + 50 Hours)
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 50);
        const formattedDeadline = deadline.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

        let calculatedTotal = 0;
        const finalOrderItems = [];
        let itemsListHtml = ''; 

        for (const item of orderItems) {
            const productFromDb = await Product.findById(item.product);
            
            if (!productFromDb) return res.status(404).json({ message: `Product not found` });
            if (productFromDb.stock < item.quantity) return res.status(400).json({ message: `Not enough stock` });

            calculatedTotal += productFromDb.finalPrice * item.quantity;
            
            finalOrderItems.push({
                product: productFromDb._id,
                name: productFromDb.name,
                price: productFromDb.finalPrice,
                quantity: item.quantity,
                image: productFromDb.images && productFromDb.images[0] ? productFromDb.images[0] : ''
            });

            // HTML Table Row for Invoice Email
            itemsListHtml += `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td align="left" style="padding: 16px 12px; font-size: 14px; color: #111827; font-weight: 500;">${productFromDb.name}</td>
                    <td align="center" style="padding: 16px 12px; font-size: 14px; color: #4b5563;">${item.quantity}</td>
                    <td align="right" style="padding: 16px 12px; font-size: 14px; color: #111827; font-weight: bold;">₹${productFromDb.finalPrice * item.quantity}</td>
                </tr>
            `;
        }

        // Delivery Math
        const deliveryCharge = calculatedTotal > 199 ? 0 : 39;
        const grandTotal = calculatedTotal + deliveryCharge;

        const customOrderId = await generateUniqueOrderId();

        const order = new Order({
            orderId: customOrderId,
            user: req.user._id,
            orderItems: finalOrderItems,
            shippingAddress,
            paymentMethod: paymentMethod || 'online',
            totalAmount: calculatedTotal, // Keeping DB standard
            deliveryDeadline: deadline,
            paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid',
            orderStatus: 'Processing'
        });

        const createdOrder = await order.save();

        // 📧 INVOICE EMAIL HTML
        try {
            const message = `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <table width="100%" style="margin-bottom: 30px;">
                        <tr>
                            <td>
                                <h1 style="color: #2563EB; margin: 0; font-size: 32px; font-weight: 900;">Tech_Masters</h1>
                                <p style="color: #9ca3af; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Official Invoice</p>
                            </td>
                            <td align="right">
                                <h2 style="margin: 0; font-size: 24px; color: #111827;">#${customOrderId}</h2>
                                <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Date: ${formattedDate}</p>
                            </td>
                        </tr>
                    </table>

                    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 40px;">
                        <table width="100%">
                            <tr>
                                <td>
                                    <span style="font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; margin-right: 8px;">Status: </span> 
                                    <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; text-transform: uppercase;">PROCESSING</span>
                                </td>
                                <td align="right" style="color: #ea580c; font-weight: bold; font-size: 14px;">
                                    ⏱ Deliver By: ${formattedDeadline}
                                </td>
                            </tr>
                        </table>
                    </div>

                    <table width="100%" style="margin-bottom: 40px;">
                        <tr>
                            <td width="50%" valign="top">
                                <p style="font-size: 11px; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Billed To</p>
                                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827;">${req.user.name}</p>
                                <p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563;">✉ ${req.user.email}</p>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #4b5563;">📞 ${shippingAddress.phone}</p>
                                ${req.user.altPhone ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #4b5563;">📞 ${req.user.altPhone} (Alt)</p>` : ''}
                            </td>
                            <td width="50%" valign="top" align="right">
                                <p style="font-size: 11px; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Shipped To</p>
                                <p style="margin: 0; font-size: 14px; color: #111827;">${shippingAddress.address}</p>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #111827;">${shippingAddress.city}, ${shippingAddress.postalCode}</p>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #111827;">${shippingAddress.country || 'India'}</p>
                            </td>
                        </tr>
                    </table>

                    <table width="100%" style="border-collapse: collapse; margin-bottom: 40px;">
                        <thead>
                            <tr style="background-color: #f3f4f6; border-top: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb;">
                                <th align="left" style="padding: 12px; font-size: 14px; color: #374151;">Item Description</th>
                                <th align="center" style="padding: 12px; font-size: 14px; color: #374151; width: 80px;">Qty</th>
                                <th align="right" style="padding: 12px; font-size: 14px; color: #374151; width: 120px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsListHtml}
                        </tbody>
                    </table>

                    <table width="100%" style="border-top: 2px solid #e5e7eb; padding-top: 30px;">
                        <tr>
                            <td width="40%" valign="bottom">
                                <p style="font-size: 11px; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Payment Details</p>
                                <p style="margin: 0 0 6px 0; font-size: 14px; color: #374151;"><strong>Method:</strong> <span style="text-transform: uppercase;">${paymentMethod}</span></p>
                                <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Status:</strong> <span style="background-color: ${paymentMethod === 'cod' ? '#fef3c7' : '#dcfce7'}; color: ${paymentMethod === 'cod' ? '#92400e' : '#166534'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${paymentMethod === 'cod' ? 'PENDING' : 'PAID'}</span></p>
                            </td>
                            <td width="60%" valign="bottom" align="right">
                                <table width="280" style="margin-left: auto;">
                                    <tr>
                                        <td align="left" style="padding: 6px 0; font-size: 15px; color: #4b5563;">Subtotal</td>
                                        <td align="right" style="padding: 6px 0; font-size: 15px; color: #111827; font-weight: bold;">₹${calculatedTotal}</td>
                                    </tr>
                                    <tr>
                                        <td align="left" style="padding: 6px 0; font-size: 15px; color: #4b5563;">Delivery</td>
                                        <td align="right" style="padding: 6px 0; font-size: 15px; color: ${deliveryCharge === 0 ? '#16a34a' : '#111827'}; font-weight: bold;">${deliveryCharge === 0 ? 'Free' : '₹' + deliveryCharge}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 12px;"></td>
                                    </tr>
                                    <tr>
                                        <td align="left" style="font-size: 24px; color: #1e3a8a; font-weight: 900;">Grand Total</td>
                                        <td align="right" style="font-size: 24px; color: #1e3a8a; font-weight: 900;">₹${grandTotal}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" align="right" style="font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; padding-top: 6px;">Inclusive of all taxes</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 60px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                        <p style="color: #4b5563; font-weight: bold; font-size: 14px; margin: 0 0 5px 0;">Thank you for shopping with Tech_Masters!</p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is a computer-generated document. No signature is required.</p>
                    </div>
                </div>
            `;

            await sendEmail({
                email: req.user.email,
                subject: `Tech_Masters Invoice - Order #${customOrderId}`,
                message,
            });
            console.log('Order Confirmation Email Sent');
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        res.status(201).json(createdOrder);

    } catch (error) {
        res.status(500).json({ message: 'Order creation failed', error: error.message });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('user', 'id name email phone altPhone') 
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'id name email phone altPhone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
};

// =================================================================
// 2. UPDATE ORDER (Sends "Shipped" or "Delivered" Email)
// =================================================================
exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user'); 

        if (order) {
            const newStatus = req.params.status.charAt(0).toUpperCase() + req.params.status.slice(1);
            order.orderStatus = newStatus;

            if (newStatus === 'Delivered') {
                order.deliveredAt = Date.now();
                if(order.paymentMethod === 'cod') {
                    order.paymentStatus = 'Paid';
                }
            }

            const updatedOrder = await order.save();

            // 📧 UPDATE EMAIL HTML (Uses Invoice layout but changes top color/status)
            try {
                const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                const formattedDeadline = new Date(order.deliveryDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                
                // Math logic
                const calculatedTotal = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                const deliveryCharge = calculatedTotal > 199 ? 0 : 39;
                const grandTotal = calculatedTotal + deliveryCharge;

                // Build Item Rows
                let itemsListHtml = '';
                order.orderItems.forEach(item => {
                    itemsListHtml += `
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td align="left" style="padding: 16px 12px; font-size: 14px; color: #111827; font-weight: 500;">${item.name}</td>
                            <td align="center" style="padding: 16px 12px; font-size: 14px; color: #4b5563;">${item.quantity}</td>
                            <td align="right" style="padding: 16px 12px; font-size: 14px; color: #111827; font-weight: bold;">₹${item.price * item.quantity}</td>
                        </tr>
                    `;
                });

                // Style configurations based on status
                let headerMsg = '';
                let statusBgColor = '';
                let statusTextColor = '';

                if (newStatus === 'Shipped') {
                    headerMsg = 'Your order is on the way! 🚚';
                    statusBgColor = '#dbeafe'; // light blue
                    statusTextColor = '#1e40af'; // dark blue
                } else if (newStatus === 'Delivered') {
                    headerMsg = 'Your order has been delivered! 🎉';
                    statusBgColor = '#dcfce7'; // light green
                    statusTextColor = '#166534'; // dark green
                } else {
                    headerMsg = `Order Update: ${newStatus}`;
                    statusBgColor = '#f3f4f6';
                    statusTextColor = '#374151';
                }

                const message = `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        
                        <h2 style="color: ${statusTextColor}; text-align: center; font-size: 24px; margin-bottom: 30px;">${headerMsg}</h2>

                        <table width="100%" style="margin-bottom: 30px;">
                            <tr>
                                <td>
                                    <h1 style="color: #2563EB; margin: 0; font-size: 32px; font-weight: 900;">Tech_Masters</h1>
                                </td>
                                <td align="right">
                                    <h2 style="margin: 0; font-size: 24px; color: #111827;">#${order.orderId || order._id.toString().slice(-8).toUpperCase()}</h2>
                                    <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Date: ${formattedDate}</p>
                                </td>
                            </tr>
                        </table>

                        <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 40px;">
                            <table width="100%">
                                <tr>
                                    <td>
                                        <span style="font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; margin-right: 8px;">Status: </span> 
                                        <span style="background-color: ${statusBgColor}; color: ${statusTextColor}; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${newStatus}</span>
                                    </td>
                                    ${newStatus !== 'Delivered' ? `
                                    <td align="right" style="color: #ea580c; font-weight: bold; font-size: 14px;">
                                        ⏱ Deliver By: ${formattedDeadline}
                                    </td>` : ''}
                                </tr>
                            </table>
                        </div>

                        <table width="100%" style="margin-bottom: 40px;">
                            <tr>
                                <td width="50%" valign="top">
                                    <p style="font-size: 11px; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Customer Info</p>
                                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827;">${order.user.name}</p>
                                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563;">✉ ${order.user.email}</p>
                                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #4b5563;">📞 ${order.shippingAddress.phone}</p>
                                    ${order.user.altPhone ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #4b5563;">📞 ${order.user.altPhone} (Alt)</p>` : ''}
                                </td>
                                <td width="50%" valign="top" align="right">
                                    <p style="font-size: 11px; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Delivery Address</p>
                                    <p style="margin: 0; font-size: 14px; color: #111827;">${order.shippingAddress.address}</p>
                                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #111827;">${order.shippingAddress.city}, ${order.shippingAddress.postalCode}</p>
                                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #111827;">${order.shippingAddress.country || 'India'}</p>
                                </td>
                            </tr>
                        </table>

                        <table width="100%" style="border-collapse: collapse; margin-bottom: 40px;">
                            <thead>
                                <tr style="background-color: #f3f4f6; border-top: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb;">
                                    <th align="left" style="padding: 12px; font-size: 14px; color: #374151;">Item Description</th>
                                    <th align="center" style="padding: 12px; font-size: 14px; color: #374151; width: 80px;">Qty</th>
                                    <th align="right" style="padding: 12px; font-size: 14px; color: #374151; width: 120px;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsListHtml}
                            </tbody>
                        </table>

                        <table width="100%" style="border-top: 2px solid #e5e7eb; padding-top: 30px;">
                            <tr>
                                <td width="40%" valign="bottom">
                                    <p style="font-size: 11px; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Payment Details</p>
                                    <p style="margin: 0 0 6px 0; font-size: 14px; color: #374151;"><strong>Method:</strong> <span style="text-transform: uppercase;">${order.paymentMethod}</span></p>
                                    <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Status:</strong> <span style="background-color: ${order.paymentStatus === 'Paid' ? '#dcfce7' : '#fef3c7'}; color: ${order.paymentStatus === 'Paid' ? '#166534' : '#92400e'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${order.paymentStatus}</span></p>
                                </td>
                                <td width="60%" valign="bottom" align="right">
                                    <table width="280" style="margin-left: auto;">
                                        <tr>
                                            <td align="left" style="padding: 6px 0; font-size: 15px; color: #4b5563;">Subtotal</td>
                                            <td align="right" style="padding: 6px 0; font-size: 15px; color: #111827; font-weight: bold;">₹${calculatedTotal}</td>
                                        </tr>
                                        <tr>
                                            <td align="left" style="padding: 6px 0; font-size: 15px; color: #4b5563;">Delivery</td>
                                            <td align="right" style="padding: 6px 0; font-size: 15px; color: ${deliveryCharge === 0 ? '#16a34a' : '#111827'}; font-weight: bold;">${deliveryCharge === 0 ? 'Free' : '₹' + deliveryCharge}</td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" style="border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 12px;"></td>
                                        </tr>
                                        <tr>
                                            <td align="left" style="font-size: 24px; color: #1e3a8a; font-weight: 900;">Grand Total</td>
                                            <td align="right" style="font-size: 24px; color: #1e3a8a; font-weight: 900;">₹${grandTotal}</td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" align="right" style="font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; padding-top: 6px;">Inclusive of all taxes</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <div style="margin-top: 60px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                            <p style="color: #4b5563; font-weight: bold; font-size: 14px; margin: 0 0 5px 0;">Thank you for shopping with Tech_Masters!</p>
                        </div>
                    </div>
                `;

                if (order.user && order.user.email) {
                    await sendEmail({
                        email: order.user.email,
                        subject: `Update on Order #${order.orderId || order._id.toString().slice(-8).toUpperCase()}: ${newStatus}`,
                        message,
                    });
                }
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
};