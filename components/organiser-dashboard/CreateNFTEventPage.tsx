'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWeb3Events } from '@/contexts/Web3EventContext';
import {
    FiCalendar, FiClock, FiUsers, FiDollarSign, FiMapPin,
    FiImage, FiTag, FiGlobe, FiMonitor, FiPlus, FiInfo,
    FiZap, FiAward, FiStar, FiEye, FiAlertCircle
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { BsTicketPerforated } from 'react-icons/bs';
import ImageUpload from '@/components/ImageUpload';

export default function CreateNFTEventPage() {
    const { address } = useAccount();
    const { state, createEvent, mintTicket, batchMintTickets } = useWeb3Events();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        location: '',
        startTime: '',
        endTime: '',
        ticketPrice: '',
        maxAttendees: '',
        isVirtual: false,
        tags: '',
    });

    const [mintOptions, setMintOptions] = useState({
        enableMinting: false,
        quantity: 1,
        ticketType: 'General',
        isTransferable: true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1); // 1: Event Details, 2: NFT Configuration, 3: Review & Mint
    const [eventCreated, setEventCreated] = useState(false);
    const [createdEventId, setCreatedEventId] = useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleMintOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setMintOptions(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                   name === 'quantity' ? parseInt(value) || 1 : 
                   type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleCreateEvent = async () => {
        if (!address) return;

        setIsSubmitting(true);
        try {
            // Validate dates
            const startTime = new Date(formData.startTime).getTime();
            const endTime = new Date(formData.endTime).getTime();
            const now = Date.now();

            if (startTime <= now) {
                throw new Error('Start time must be in the future');
            }

            if (endTime <= startTime) {
                throw new Error('End time must be after start time');
            }

            // Create event data
            const eventData = {
                name: formData.name,
                description: formData.description,
                imageUrl: formData.imageUrl,
                location: formData.location,
                startTime,
                endTime,
                ticketPrice: formData.ticketPrice,
                maxAttendees: parseInt(formData.maxAttendees),
                isVirtual: formData.isVirtual,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            };

            // Create the event
            await createEvent(eventData);
            
            // Get the newly created event ID (simplified approach)
            const eventId = state.events.length + 1;
            setCreatedEventId(eventId);
            setEventCreated(true);
            setCurrentStep(2); // Move to NFT configuration step

        } catch (error) {
            console.error('Error creating event:', error);
            alert(error instanceof Error ? error.message : 'Failed to create event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMintNFTs = async () => {
        if (!createdEventId) return;

        setIsSubmitting(true);
        try {
            if (mintOptions.quantity === 1) {
                await mintTicket(createdEventId, mintOptions.ticketType, mintOptions.isTransferable);
            } else {
                await batchMintTickets(createdEventId, mintOptions.ticketType, mintOptions.isTransferable, mintOptions.quantity);
            }

            // Show success message
            setShowSuccess(true);
            setCurrentStep(3); // Move to success step

            setTimeout(() => setShowSuccess(false), 5000);

        } catch (error) {
            console.error('Error minting NFTs:', error);
            alert(error instanceof Error ? error.message : 'Failed to mint NFTs');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            name: '',
            description: '',
            imageUrl: '',
            location: '',
            startTime: '',
            endTime: '',
            ticketPrice: '',
            maxAttendees: '',
            isVirtual: false,
            tags: '',
        });

        setMintOptions({
            enableMinting: false,
            quantity: 1,
            ticketType: 'General',
            isTransferable: true,
        });

        setCurrentStep(1);
        setEventCreated(false);
        setCreatedEventId(null);
    };

    if (!address) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
                <motion.div 
                    className="text-center bg-white rounded-3xl p-12 shadow-2xl border border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BsTicketPerforated className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4 text-gray-900">Connect Your Wallet</h1>
                    <p className="text-gray-600 mb-8 max-w-md">
                        Connect your Web3 wallet to create NFT events and mint tickets on the blockchain.
                    </p>
                    <div className="flex justify-center">
                        <ConnectButton />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Success Message */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                    >
                        <FiAward className="w-6 h-6" />
                        <div>
                            <div className="font-semibold">Event Created Successfully!</div>
                            <div className="text-sm opacity-90">Your NFT event is now live on the blockchain</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div
                className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                <div className="relative">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-3 flex items-center gap-3">
                        <HiOutlineSparkles className="w-12 h-12" />
                        Create NFT Event
                    </h1>
                    <p className="text-orange-100 text-lg mb-4">
                        {currentStep === 1 && "Step 1: Create your event details"}
                        {currentStep === 2 && "Step 2: Configure NFT ticket properties"}
                        {currentStep === 3 && "Step 3: Review and mint your NFTs"}
                    </p>
                    
                    {/* Step Indicator */}
                    <div className="flex items-center gap-4 mb-4">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    currentStep >= step 
                                        ? 'bg-white text-orange-600' 
                                        : 'bg-white/20 text-white'
                                }`}>
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div className={`w-8 h-0.5 ${
                                        currentStep > step ? 'bg-white' : 'bg-white/20'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
                            <BsTicketPerforated className="w-5 h-5" />
                            <span className="font-semibold">NFT Tickets</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
                            <FiZap className="w-5 h-5" />
                            <span className="font-semibold">Blockchain Powered</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
                            <FiStar className="w-5 h-5" />
                            <span className="font-semibold">Transferable</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Form */}
            <motion.div
                className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="p-8">
                    {currentStep === 1 && (
                        <div className="space-y-8">
                        {/* Basic Event Information */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <FiInfo className="w-6 h-6 text-orange-500" />
                                Event Details
                            </h2>

                            {/* Event Name */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-lg font-medium flex items-center gap-2">
                                        <FiCalendar className="w-5 h-5 text-orange-500" />
                                        Event Name *
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your amazing event name"
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-lg font-medium">Description *</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe your event in detail..."
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg h-32 resize-none"
                                    required
                                />
                            </div>

                            {/* Image Upload via Pinata */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-lg font-medium flex items-center gap-2">
                                        <FiImage className="w-5 h-5 text-orange-500" />
                                        Event Image
                                    </span>
                                </label>
                                <ImageUpload
                                    onImageUploaded={(cid, url) => setFormData(prev => ({ ...prev, imageUrl: url }))
                                    }
                                    onUploadError={(err) => alert(err)}
                                />
                                {formData.imageUrl && (
                                    <div className="text-sm text-gray-500 mt-2 break-all">
                                        Uploaded: {formData.imageUrl}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location and Virtual Toggle */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-lg font-medium flex items-center gap-2">
                                        <FiMapPin className="w-5 h-5 text-orange-500" />
                                        Location *
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="City, Country or Virtual Platform"
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-lg font-medium flex items-center gap-2">
                                        <FiMonitor className="w-5 h-5 text-orange-500" />
                                        Event Type
                                    </span>
                                </label>
                                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isVirtual"
                                            checked={formData.isVirtual}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <span className="text-lg">Virtual Event</span>
                                    </label>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <FiGlobe className="w-4 h-4" />
                                        Online accessible
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-lg font-medium flex items-center gap-2">
                                        <FiClock className="w-5 h-5 text-orange-500" />
                                        Start Date & Time *
                                    </span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-lg font-medium flex items-center gap-2">
                                        <FiClock className="w-5 h-5 text-orange-500" />
                                        End Date & Time *
                                    </span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Ticket Price and Max Attendees */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-lg font-medium flex items-center gap-2">
                                        <FiDollarSign className="w-5 h-5 text-orange-500" />
                                        Ticket Price (ETH) *
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    name="ticketPrice"
                                    value={formData.ticketPrice}
                                    onChange={handleInputChange}
                                    placeholder="0.01"
                                    min="0"
                                    step="0.001"
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
                                    required
                                />
                                <div className="text-sm text-gray-500 mt-2">
                                    Price in ETH for each NFT ticket
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-lg font-medium flex items-center gap-2">
                                        <FiUsers className="w-5 h-5 text-orange-500" />
                                        Max Attendees *
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    name="maxAttendees"
                                    value={formData.maxAttendees}
                                    onChange={handleInputChange}
                                    placeholder="100"
                                    min="1"
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
                                    required
                                />
                                <div className="text-sm text-gray-500 mt-2">
                                    Maximum number of NFT tickets to mint
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-lg font-medium flex items-center gap-2">
                                    <FiTag className="w-5 h-5 text-orange-500" />
                                    Tags
                                </span>
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleInputChange}
                                placeholder="Conference, Blockchain, Networking, NFT"
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
                            />
                            <div className="text-sm text-gray-500 mt-2">
                                Separate tags with commas to help people discover your event
                            </div>
                        </div>

                            {/* Create Event Button */}
                            <motion.button
                                type="button"
                                onClick={handleCreateEvent}
                                disabled={isSubmitting || state.loading}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg flex items-center justify-center gap-3"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSubmitting || state.loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        Creating Event...
                                    </>
                                ) : (
                                    <>
                                        <FiPlus className="w-6 h-6" />
                                        Create Event
                                    </>
                                )}
                            </motion.button>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-8">
                            {/* Event Created Success */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <FiAward className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-emerald-900">Event Created Successfully!</h3>
                                        <p className="text-emerald-700">Your event is now live on the blockchain</p>
                                    </div>
                                </div>
                            </div>

                            {/* NFT Configuration */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <BsTicketPerforated className="w-6 h-6 text-purple-500" />
                                    Configure NFT Tickets
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Set up the properties for your NFT tickets before minting
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Quantity</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            min={1}
                                            max={50}
                                            value={mintOptions.quantity}
                                            onChange={handleMintOptionChange}
                                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg"
                                        />
                                        <div className="text-sm text-gray-500 mt-2">Max 50 tickets</div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Ticket Type</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="ticketType"
                                            value={mintOptions.ticketType}
                                            onChange={handleMintOptionChange}
                                            placeholder="VIP, General, Early Bird"
                                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Transferable</span>
                                        </label>
                                        <select
                                            name="isTransferable"
                                            value={mintOptions.isTransferable ? 'true' : 'false'}
                                            onChange={handleMintOptionChange}
                                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg"
                                        >
                                            <option value="true">Yes - Can be transferred</option>
                                            <option value="false">No - Non-transferable</option>
                                        </select>
                                        <div className="text-sm text-gray-500 mt-2">Allow ticket transfers</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 mt-8">
                                    <motion.button
                                        type="button"
                                        onClick={() => setCurrentStep(1)}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Back to Event Details
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        onClick={() => setCurrentStep(3)}
                                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg flex items-center justify-center gap-3"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <BsTicketPerforated className="w-6 h-6" />
                                        Review & Mint
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-8">
                            {/* Review Section */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <FiEye className="w-6 h-6 text-blue-500" />
                                    Review Your NFT Tickets
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-3">Event Details</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Name:</strong> {formData.name}</div>
                                            <div><strong>Location:</strong> {formData.location}</div>
                                            <div><strong>Date:</strong> {new Date(formData.startTime).toLocaleDateString()}</div>
                                            <div><strong>Price:</strong> {formData.ticketPrice} ETH</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-3">NFT Configuration</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Quantity:</strong> {mintOptions.quantity}</div>
                                            <div><strong>Type:</strong> {mintOptions.ticketType}</div>
                                            <div><strong>Transferable:</strong> {mintOptions.isTransferable ? 'Yes' : 'No'}</div>
                                            <div><strong>Event ID:</strong> #{createdEventId}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <motion.button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Back to Configuration
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={handleMintNFTs}
                                    disabled={isSubmitting || state.loading}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg flex items-center justify-center gap-3"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isSubmitting || state.loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                            Minting NFTs...
                                        </>
                                    ) : (
                                        <>
                                            <BsTicketPerforated className="w-6 h-6" />
                                            Mint NFT Tickets
                                        </>
                                    )}
                                </motion.button>
                            </div>

                            {/* Success Message */}
                            {showSuccess && (
                                <motion.div
                                    className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <FiAward className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-emerald-900">NFTs Minted Successfully!</h3>
                                            <p className="text-emerald-700">Your NFT tickets are now live on the blockchain</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <motion.button
                                            onClick={handleReset}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Create Another Event
                                        </motion.button>
                                        <motion.button
                                            onClick={() => window.location.href = '/organiser-dashboard/events'}
                                            className="bg-white border border-emerald-500 text-emerald-500 hover:bg-emerald-50 font-bold py-3 px-6 rounded-xl transition-all duration-300"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            View My Events
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                        {/* Error Display */}
                        {state.error && (
                            <motion.div
                                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">!</span>
                                </div>
                                <div className="text-red-700">{state.error}</div>
                            </motion.div>
                        )}
                </div>

                {/* Info Footer */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-t border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FiInfo className="w-5 h-5 text-blue-500" />
                        NFT Event Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Your event will be stored immutably on the blockchain</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>NFT tickets can be transferred, sold, or collected</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Smart contracts ensure secure and transparent transactions</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Attendees get unique, verifiable digital collectibles</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
