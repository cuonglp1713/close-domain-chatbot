'use client'

import React, {useState, useEffect, useRef} from 'react'
import {
    MessageSquare,
    HelpCircle,
    Settings,
    Send,
    Upload,
    Moon,
    Sun,
    LogOut,
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    MoreVertical,
    X,
} from 'lucide-react'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Textarea} from "@/components/ui/textarea"
import {toast} from "@/hooks/use-toast"
import {useRouter} from 'next/navigation'
import { models, Model } from './const/models';
import ReactMarkdown from 'react-markdown';
import FormData from 'form-data';
// import {router} from "next/client";


type AdditionalInfo = {
    message_id: number;
    info_key: string;
    info_value: string;
}

// Add these types to your existing types
// type UploadStatus = {
//     progress: number;
//     error?: string;
//     filename?: string;
// }

type UploadingFile = {
    file: File;
    progress: number;
}

type Message = {
    message_id: number;
    conversation_id: number;
    timestamp: string;
    role: 'user' | 'bot';
    content: string;
    additional_info?: AdditionalInfo[];
}

type Conversation = {
    conversation_id: number;
}

// type Model = {
//     id: number;
//     name: string;
//     description: string;
//     model_type: string;
// }

const API_URL = 'http://localhost:8018/api';
const NewConversationIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
    >
        <path
            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

export function ChatInterfaceComponent() {
    const router = useRouter()
    // useEffect(() => {
    //     // Kiểm tra xem JWT token có tồn tại không (lưu trong localStorage)
    //     const token = localStorage.getItem('token');
    //
    //     if (!token) {
    //         // Nếu không có token, chuyển hướng về trang đăng nhập
    //         router.push('/login');
    //     }
    // }, [router]);

    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [currentModel] = useState<Model>({
        id: 1,
        name: 'Kiến thức chung',
        description: '',
        model_type: 'wiki'
    })
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
    const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const [popupContent, setPopupContent] = useState<{ title: string; content: string }>({title: '', content: ''})
    const [isBotThinking, setIsBotThinking] = useState(false)
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
    const [feedbackContent, setFeedbackContent] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
    const [isUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const chatAreaRef = useRef<HTMLDivElement>(null)

    console.log(router);

    // const models: Models[] = [
    //     {id: 1, name: 'Kiến thức chung', description: 'Hỏi đáp kiến thức chung', model_type: 'general'},
    //     {id: 2, name: 'Pháp luật', description: 'Hỏi đáp về pháp luật', model_type: 'law'},
    //     {id: 3, name: 'File QA', description: 'Hỏi đáp trên file', model_type: 'file_qa'},
    //     {id: 4, name: 'Text2SQL', description: '', model_type: 'text2sql'},
    //     {id: 5, name: 'Dịch', description: '', model_type: 'translate'},
    //     {id: 6, name: 'Tóm tắt', description: '', model_type: 'summary'}
    // ]


    useEffect(() => {
        document.body.classList.toggle('dark', isDarkMode)
    }, [isDarkMode])

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        handleResize()

        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
        }
    }, [messages])

    useEffect(() => {
        fetchConversations()
    }, [])

    useEffect(() => {
        if (currentConversation) {
            fetchMessages(currentConversation.conversation_id)
        }
    }, [currentConversation])


    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        setUploadingFiles(files.map(file => ({file, progress: 0})))
        setInputValue('')
    }

    const fetchConversations = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_URL}/conversations`)
            if (!response.ok) {
                throw new Error('Failed to fetch conversations')
            }
            const data = await response.json()
            if (Array.isArray(data)) {
                setConversations(data)
            } else {
                throw new Error('Invalid data format for conversations')
            }
        } catch (error) {
            console.error('Error fetching conversations:', error)
            setError('Failed to load conversations. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // const fetchMessages = async (conversationId: number) => {
    //     setIsLoading(true)
    //     setError(null)
    //     try {
    //         const response = await fetch(`${API_URL}/conversations/${conversationId}`)
    //         if (!response.ok) {
    //             throw new Error('Failed to fetch messages')
    //         }
    //         const data = await response.json()
    //         if (Array.isArray(data)) {
    //             setMessages(data)
    //         } else {
    //             throw new Error('Invalid data format for messages')
    //         }
    //     } catch (error) {
    //         console.error('Error fetching messages:', error)
    //         setError('Failed to load messages. Please try again.')
    //     } finally {
    //         setIsLoading(false)
    //     }
    // }

    // const transferToFastAPI = async (filePath: string) => {
    //     const formData = new FormData()
    //     formData.append('file', filePath)
    //
    //     try {
    //         const response = await fetch(FASTAPI_UPLOAD_URL, {
    //             method: 'POST',
    //             body: formData,
    //         })
    //
    //         if (!response.ok) {
    //             throw new Error('Failed to transfer file to FastAPI')
    //         }
    //
    //         const result = await response.json()
    //         console.log('FastAPI processing result:', result)
    //         return result
    //     } catch (error) {
    //         console.error('Error transferring file to FastAPI:', error)
    //         throw error
    //     }
    // }


    const fetchMessages = async (conversationId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/conversations/${conversationId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            const messages = await response.json();

            // Fetch additional info for each message
            const messagesWithInfo = await Promise.all(
                messages.map(async (message: Message) => {
                    if (message.role === 'bot') {
                        const infoResponse = await fetch(`${API_URL}/messages/${message.message_id}/info`);
                        if (infoResponse.ok) {
                            const additionalInfo = await infoResponse.json();
                            return {...message, additional_info: additionalInfo};
                        }
                    }
                    return message;
                })
            );

            setMessages(messagesWithInfo);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setError('Failed to load messages. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const [messageStates, setMessageStates] = useState<{
        [key: number]: {
            showInfo: boolean;
        };
    }>({});

    // Add toggle function for additional info
    const toggleAdditionalInfo = (messageId: number) => {
        setMessageStates(prev => ({
            ...prev,
            [messageId]: {
                ...prev[messageId],
                showInfo: !prev[messageId]?.showInfo
            }
        }));
    };

    // // Add this function to handle file upload
    // const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = event.target.files?.[0];
    //     if (!file) return;
    //
    //     // Validate file size (5MB limit)
    //     if (file.size > 5 * 1024 * 1024) {
    //         toast({
    //             title: "Error",
    //             description: "File size must be less than 5MB",
    //             variant: "destructive",
    //         });
    //         return;
    //     }
    //
    //     // Validate file type
    //     const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    //     if (!allowedTypes.includes(file.type)) {
    //         toast({
    //             title: "Error",
    //             description: "Only images and documents are allowed",
    //             variant: "destructive",
    //         });
    //         return;
    //     }
    //
    //     setIsUploading(true);
    //     setUploadStatus({progress: 0});
    //
    //     const formData = new FormData();
    //     formData.append('file', file);
    //
    //     try {
    //         const xhr = new XMLHttpRequest();
    //
    //         xhr.upload.onprogress = (event) => {
    //             if (event.lengthComputable) {
    //                 const progress = Math.round((event.loaded / event.total) * 100);
    //                 setUploadStatus(prev => ({...prev!, progress}));
    //             }
    //         };
    //
    //         xhr.onload = () => {
    //             if (xhr.status === 200) {
    //                 const response = JSON.parse(xhr.responseText);
    //                 setUploadStatus(prev => ({
    //                     ...prev!,
    //                     progress: 100,
    //                     filename: response.filename
    //                 }));
    //                 toast({
    //                     title: "Success",
    //                     description: "File uploaded successfully",
    //                 });
    //
    //                 // Add file reference to the chat
    //                 const fileMessage = `Uploaded file: ${file.name}`;
    //                 // handleSend(fileMessage);
    //             } else {
    //                 throw new Error('Upload failed');
    //             }
    //         };
    //
    //         xhr.onerror = () => {
    //             throw new Error('Upload failed');
    //         };
    //
    //         xhr.onloadend = () => {
    //             setIsUploading(false);
    //             if (fileInputRef.current) {
    //                 fileInputRef.current.value = '';
    //             }
    //         };
    //
    //         xhr.open('POST', `${API_URL}/upload`);
    //         xhr.send(formData);
    //     } catch (error) {
    //         setUploadStatus(prev => ({
    //             ...prev!,
    //             error: 'Failed to upload file'
    //         }));
    //         toast({
    //             title: "Error",
    //             description: "Failed to upload file",
    //             variant: "destructive",
    //         });
    //         setIsUploading(false);
    //     }
    // };
    //
    // // Add this function to handle upload button click
    // const handleUploadClick = () => {
    //     fileInputRef.current?.click();
    // };

    // // Add this function to cancel upload
    // const cancelUpload = () => {
    //     setIsUploading(false);
    //     setUploadStatus(null);
    //     if (fileInputRef.current) {
    //         fileInputRef.current.value = '';
    //     }
    // };


    const cancelUpload = (index: number) => {
        setUploadingFiles(prev => prev.filter((_, i) => i !== index))
    }

    const transferToFastAPI = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(FASTAPI_UPLOAD_URL, {
                method: 'POST',
                body: formData as unknown as BodyInit,
                headers:{
                    // nah
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`FastAPI error: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            console.log('FastAPI processing result:', result);
            return result;
        } catch (error) {
            console.error('Error transferring file to FastAPI:', error);
            throw error;
        }
    }


    const handleSend = async () => {
        if (uploadingFiles.length > 0 || inputValue.trim()) {
            setIsBotThinking(true)
            const newConversationId = currentConversation ? currentConversation.conversation_id : Date.now()

            try {
                // Handle file uploads first if any
                if (uploadingFiles.length > 0) {
                    const uploadedFiles = []
                    for (const uploadingFile of uploadingFiles) {
                        const formData = new FormData()
                        formData.append('file', uploadingFile.file)

                        const response = await fetch(`${API_URL}/upload`, {
                            method: 'POST',
                            body: formData as unknown as BodyInit,
                            headers:{
                                // nah
                            },
                        })

                        if (!response.ok) {
                            throw new Error('Upload failed')
                        }

                        const result = await response.json()
                        uploadedFiles.push(result.filename)

                        // try {
                        //     const fastAPIResult = await transferToFastAPI(result.path)
                        //     console.log('FastAPI processing result:', fastAPIResult)
                        //     // You can add the FastAPI result to the message or handle it as needed
                        // } catch (fastAPIError) {
                        //     console.error('Error processing file with FastAPI:', fastAPIError)
                        //     // Handle the error as needed, e.g., show a warning to the user
                        // }
                        // Transfer the uploaded file to FastAPI
                        try {
                            const fastAPIResult = await transferToFastAPI(uploadingFile.file);
                            console.log('FastAPI processing result:', fastAPIResult);
                            // You can add the FastAPI result to the message or handle it as needed
                        } catch (fastAPIError) {
                            console.error('Error processing file with FastAPI:', fastAPIError);
                            toast({
                                title: "Warning",
                                description: "File uploaded but additional processing failed. The file may not be fully analyzed.",
                                // variant: "warning",
                            });
                        }
                    }

                    // Add user message with file information
                    const fileMessage = uploadedFiles.length === 1
                        ? `Uploaded file: ${uploadedFiles[0]}`
                        : `Uploaded files: ${uploadedFiles.join(', ')}`
                    await addMessage(newConversationId, 'user', fileMessage)

                    // Add bot response for files
                    const botFileResponse = uploadedFiles.length === 1
                        ? `Đã tải lên ${uploadedFiles[0]}`
                        : `Đã tải lên ${uploadedFiles.length} tệp`
                    await addMessage(newConversationId, 'bot', botFileResponse)
                }

                // Handle text message if any
                if (inputValue.trim()) {
                    console.time("Execution Time");
                    // Add user message
                    await addMessage(newConversationId, 'user', inputValue)
                    console.log(typeof newConversationId)
                    // let intConversationId = +newConversationId;  // Converts to number (integer if possible)
                    // console.log(intConversationId);              // Prints the integer value

                    setInputValue('')
                    setUploadingFiles([])
                    await fetchMessages(newConversationId)
                    // Get bot response from API
                    const botResponse = await fetch("http://localhost:8007/chat", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            conversation_id: newConversationId,
                            content: inputValue,
                            collection: currentModel.model_type
                        }),
                    })
                    console.log(newConversationId)
                    console.log(inputValue)
                    console.log(currentModel.model_type)

                    if (!botResponse.ok) {
                        throw new Error('Failed to get bot response')
                    }

                    const data = await botResponse.json()
                    const botContent = data.bot_response
                    const additionalInfo = {
                        ...data.bot_refer,
                    }
                    console.log(additionalInfo)

                    // Add bot response with additional info
                    await addMessage(newConversationId, 'bot', botContent, additionalInfo)
                    console.timeEnd("Execution Time"); // Kết thúc đo thời gian
                }

                // Reset states
                setInputValue('')
                setUploadingFiles([])

                // Handle conversation state
                if (!currentConversation) {
                    setCurrentConversation({conversation_id: newConversationId})
                    await fetchConversations()
                }

                // Fetch updated messages
                await fetchMessages(newConversationId)

            } catch (error) {
                console.error('Error in handleSend:', error)
                toast({
                    title: "Error",
                    description: 'Failed to send message. Please try again.',
                    variant: "destructive",
                })
            } finally {
                setIsBotThinking(false)
            }
        }
    }


    // const handleSend = async () => {
    //     if (inputValue.trim()) {
    //         setIsBotThinking(true)
    //         const newConversationId = currentConversation ? currentConversation.conversation_id : Date.now()
    //
    //         try {
    //             // Add user message
    //             await addMessage(newConversationId, 'user', inputValue)
    //
    //             // Simulate bot response
    //             // const botResponse = "This is a simulated bot response."
    //             // await addMessage(newConversationId, 'bot', botResponse)
    //             console.log(currentModel)
    //             const botResponse = await fetch("http://localhost:8007/chat", {
    //                 method: "POST",
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                 },
    //                 body: JSON.stringify({
    //                     content: inputValue, // Tin nhắn người dùng nhập vào
    //                     collection: currentModel.name
    //                 }),
    //             });
    //             const data = await botResponse.json();
    //             console.log("Phản hồi từ server:", data);
    //
    //             const botContent = data.bot_response
    //             console.log("Bot content:" + botContent)
    //             const additionalInfo = {
    //                 ...data.bot_refer,
    //             };
    //             console.log("Bot refer:", additionalInfo)
    //             await addMessage(newConversationId, 'bot', botContent, additionalInfo)
    //
    //             setInputValue('')
    //
    //             if (!currentConversation) {
    //                 setCurrentConversation({conversation_id: newConversationId})
    //                 await fetchConversations()
    //             }
    //
    //             await fetchMessages(newConversationId)
    //         } catch (error) {
    //             console.error('Error sending message:', error)
    //             setError('Failed to send message. Please try again.')
    //         } finally {
    //             setIsBotThinking(false)
    //         }
    //     }
    // }

    const addMessage = async (conversationId: number, role: 'user' | 'bot', content: string, additionalInfo: Record<string, string> = {}) => {
        try {
            const response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({conversation_id: conversationId, role, content, additionalInfo}),
            })
            if (!response.ok) {
                throw new Error('Failed to add message')
            }
            await response.json()
        } catch (error) {
            console.error('Error adding message:', error)
            throw error
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend()
        }
    }

    // const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = event.target.files?.[0]
    //     if (file) {
    //         console.log('File uploaded:', file.name)
    //         // TODO: Implement file upload functionality
    //     }
    // }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const selectConversation = (conversation: Conversation) => {
        setCurrentConversation(conversation)
    }

    // const changeModel = (model: Model) => {
    //     setCurrentModel(model)
    //     setMessages([])
    //     setCurrentConversation(null)
    //     setIsModelDialogOpen(false)
    // }

    const startNewChat = () => {
        setMessages([])
        setCurrentConversation(null)
    }

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode)
    }

    const openPopup = (key: string, value: string) => {
        setPopupContent({title: key, content: value})
        setIsPopupOpen(true)
    }

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content)
        toast({
            title: "Copied to clipboard",
            description: "The message has been copied to your clipboard.",
        })
    }

    const handleLike = (id: number) => {
        // TODO: Implement like functionality
        console.log('Liked message:', id)
    }

    const handleDislike = (id: number) => {
        // TODO: Implement dislike functionality
        console.log('Disliked message:', id)
    }

    const handleRegenerate = (id: number) => {
        // TODO: Implement regenerate functionality
        console.log('Regenerating response for message:', id)
        toast({
            title: "Regenerating response",
            description: "Please wait while we regenerate the response.",
        })
    }

    const handleFeedbackSubmit = () => {
        // TODO: Implement feedback submission
        console.log("Feedback submitted:", feedbackContent)
        setFeedbackContent('')
        setIsFeedbackOpen(false)
        toast({
            title: "Feedback submitted",
            description: "Thank you for your feedback!",
        })
    }

    const handleModelChange = (route: string) => {
        setIsModelDialogOpen(false)
        router.push(route)
    }


    return (
        <div className={`flex h-screen ${isDarkMode ? 'dark' : ''}`}>
            {/* Sidebar */}
            <div
                className={`${isSidebarOpen ? 'w-64' : 'w-0 md:w-16'} flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden`}>
                <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    {isSidebarOpen ? (
                        <div className="flex items-center justify-between w-full">
                            <Button variant="outline"
                                    className="flex-grow mr-2 justify-start h-10 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    onClick={startNewChat}>
                                <NewConversationIcon/>
                                <span className="ml-2">Cuộc trò chuyện mới</span>
                            </Button>
                            <Button variant="ghost" size="icon"
                                    className="flex-shrink-0 text-gray-700 dark:text-gray-300" onClick={toggleSidebar}>
                                <ChevronLeft className="h-4 w-4"/>
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="icon"
                                className="w-full h-10 justify-center text-gray-700 dark:text-gray-300"
                                onClick={toggleSidebar}>
                            <NewConversationIcon/>
                        </Button>
                    )}
                </div>

                {isSidebarOpen && (
                    <>
                        <nav className="flex-1 overflow-y-auto">
                            <div className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Gần đây
                            </div>
                            {isLoading ? (
                                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Loading
                                    conversations...</div>
                            ) : error ? (
                                <div className="px-4 py-2 text-sm text-red-500 dark:text-red-400">{error}</div>
                            ) : conversations.length === 0 ? (
                                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No conversations
                                    yet</div>
                            ) : (
                                conversations.map((conversation) => (
                                    <Button
                                        key={conversation.conversation_id}
                                        variant="ghost"
                                        className="w-full justify-start px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => selectConversation(conversation)}
                                    >
                                        Conversation {conversation.conversation_id}
                                        {/*{currentModel.name}*/}
                                    </Button>
                                ))
                            )}
                        </nav>
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                            <Button variant="ghost"
                                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => alert('Trợ giúp clicked')}>
                                <HelpCircle className="mr-2 h-4 w-4"/>
                                Trợ giúp
                            </Button>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost"
                                            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <Settings className="mr-2 h-4 w-4"/>
                                        Cài đặt
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <div className="grid gap-4">
                                        <Button variant="ghost"
                                                className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={toggleDarkMode}>
                                            {isDarkMode ? <Sun className="mr-2 h-4 w-4"/> :
                                                <Moon className="mr-2 h-4 w-4"/>}
                                            {isDarkMode ? 'Light theme' : 'Dark theme'}
                                        </Button>
                                        <Button variant="ghost"
                                                className="w-full justify-start  text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <LogOut className="mr-2 h-4 w-4"/>
                                            Log out
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </>
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
                {/* Header */}
                <header
                    className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden mr-2 text-gray-700 dark:text-gray-300"
                                onClick={toggleSidebar}>
                            <MessageSquare className="h-6 w-6"/>
                        </Button>
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">{currentModel.name}</span>
                    </div>
                    <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="h-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => setIsModelDialogOpen(true)}>Chọn mô hình</Button>
                        </DialogTrigger>
                        <DialogContent
                            className="sm:max-w-[425px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <DialogHeader>
                                <DialogTitle>Chọn mô hình</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                {models.map((model) => (
                                    <Button
                                        key={model.id}
                                        variant="outline"
                                        className="h-20 flex flex-col items-start p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => handleModelChange(model.model_type)}
                                    >
                                        <span className="font-bold">{model.name}</span>
                                        <span
                                            className="text-sm text-gray-500 dark:text-gray-400">{model.description}</span>
                                    </Button>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/*<Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>*/}
                    {/*    <DialogTrigger asChild>*/}
                    {/*        <Button className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">*/}
                    {/*            Đổi mô hình*/}
                    {/*        </Button>*/}
                    {/*    </DialogTrigger>*/}
                    {/*    <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white">*/}
                    {/*        <DialogHeader>*/}
                    {/*            <DialogTitle>Chọn mô hình</DialogTitle>*/}
                    {/*        </DialogHeader>*/}
                    {/*        <div className="grid gap-4 py-4">*/}
                    {/*            <Button onClick={() => handleModelChange('/model1')} className="w-full justify-start">*/}
                    {/*                Mô hình 1*/}
                    {/*            </Button>*/}
                    {/*            <Button onClick={() => handleModelChange('/model2')} className="w-full justify-start">*/}
                    {/*                Mô hình 2*/}
                    {/*            </Button>*/}
                    {/*            <Button onClick={() => handleModelChange('/model3')} className="w-full justify-start">*/}
                    {/*                Mô hình 3*/}
                    {/*            </Button>*/}
                    {/*        </div>*/}
                    {/*    </DialogContent>*/}
                    {/*</Dialog>*/}
                </header>

                {/* Chat area */}
                <main ref={chatAreaRef} className="flex-1 overflow-y-auto p-4 mx-auto w-full md:w-3/5">
                    {isLoading ? (
                        <div className="text-center mt-20">
                            <p className="text-2xl text-gray-600 dark:text-gray-400">Loading messages...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center mt-20">
                            <p className="text-2xl text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center mt-20">
                            <h1 className="text-4xl font-bold mb-2">
                                <span className="text-blue-600 dark:text-blue-400">Xin chào!</span>{' '}
                                <span className="text-purple-600 dark:text-purple-400"></span>
                            </h1>
                            <p className="text-2xl text-gray-600 dark:text-gray-400">
                                Hôm nay tôi có thể giúp gì cho bạn?
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div key={message.message_id}
                                     className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        {message.role === 'user' ? (
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src="/placeholder-user.jpg" alt="User"/>
                                                <AvatarFallback>U</AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <div
                                                className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                                <MessageSquare className="h-5 w-5 text-white"/>
                                            </div>
                                        )}
                                        <div
                                            className={`bg-white dark:bg-gray-800 p-3 rounded-lg shadow max-w-md ${message.role === 'user' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>
                                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-justify">
                                                <ReactMarkdown className="text-gray-700 dark:text-gray-300">
                                                    {message.content}
                                                </ReactMarkdown>
                                            </p>
                                            {message.additional_info && message.additional_info.length > 0 && (
                                                <div className="mt-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleAdditionalInfo(message.message_id)}
                                                        className="p-0 h-auto font-normal text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        {messageStates[message.message_id]?.showInfo ? (
                                                            <ChevronUp className="h-4 w-4 mr-1 inline"/>
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 mr-1 inline"/>
                                                        )}
                                                        Nguồn tham khảo
                                                    </Button>
                                                    {messageStates[message.message_id]?.showInfo && (
                                                        <div className="mt-2 space-y-1">
                                                            {message.additional_info.map((info) => (
                                                                <Button
                                                                    key={info.info_key}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="w-full justify-start p-1 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 overflow-hidden text-ellipsis whitespace-nowrap"
                                                                    onClick={() => openPopup(info.info_key, info.info_value)}
                                                                >
                                                                    {info.info_key}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex mt-2 space-x-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"
                                                                onClick={() => handleCopy(message.content)}>
                                                            <Copy className="h-4 w-4"/>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleLike(message.message_id)}
                                                        >
                                                            <ThumbsUp className="h-4 w-4"/>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleDislike(message.message_id)}
                                                        >
                                                            <ThumbsDown className="h-4 w-4"/>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"
                                                                onClick={() => handleRegenerate(message.message_id)}>
                                                            <RefreshCw className="h-4 w-4"/>
                                                        </Button>
                                                        {!isFeedbackOpen && (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="ghost" size="icon"
                                                                            className="h-8 w-8">
                                                                        <MoreVertical className="h-4 w-4"/>
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-40">
                                                                    <Button
                                                                        variant="ghost"
                                                                        className="w-full justify-start"
                                                                        onClick={() => setIsFeedbackOpen(true)}
                                                                    >
                                                                        Feedback
                                                                    </Button>
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isBotThinking && (
                                <div className="flex justify-start">
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                            <MessageSquare className="h-5 w-5 text-white"/>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                                     style={{animationDelay: '0.2s'}}></div>
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                                     style={{animationDelay: '0.4s'}}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* Input area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    {/*{isUploading && uploadStatus && (*/}
                    {/*    <div className="mb-4 max-w-3xl mx-auto">*/}
                    {/*        <div className="flex items-center justify-between mb-2">*/}
                    {/*            <span className="text-sm text-gray-500 dark:text-gray-400">*/}
                    {/*                Uploading...*/}
                    {/*            </span>*/}
                    {/*            <Button*/}
                    {/*                variant="ghost"*/}
                    {/*                size="sm"*/}
                    {/*                onClick={cancelUpload}*/}
                    {/*                className="h-8 w-8 p-0"*/}
                    {/*            >*/}
                    {/*                <X className="h-4 w-4" />*/}
                    {/*            </Button>*/}
                    {/*        </div>*/}
                    {/*        <Progress value={uploadStatus.progress} className="h-2" />*/}
                    {/*    </div>*/}
                    {/*)}*/}

                    {/*{uploadStatus?.error && (*/}
                    {/*    <Alert variant="destructive" className="mb-4 max-w-3xl mx-auto">*/}
                    {/*        <AlertCircle className="h-4 w-4" />*/}
                    {/*        <AlertTitle>Error</AlertTitle>*/}
                    {/*        <AlertDescription>*/}
                    {/*            {uploadStatus.error}*/}
                    {/*        </AlertDescription>*/}
                    {/*    </Alert>*/}
                    {/*)}*/}

                    {uploadingFiles.length > 0 && (
                        <div className="mb-2 flex items-center space-x-2 overflow-x-auto">
                            {uploadingFiles.map((file, index) => (
                                <div key={index}
                                     className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 mr-2 truncate max-w-xs">
                                      {file.file.name}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => cancelUpload(index)}
                                        className="h-6 w-6 p-0 rounded-full"
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}


                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg max-w-3xl mx-auto">
                        {/*<Input*/}
                        {/*    placeholder="Nhập câu lệnh tại đây"*/}
                        {/*    className="flex-1 border-none bg-transparent text-gray-900 dark:text-white"*/}
                        {/*    value={inputValue}*/}
                        {/*    onChange={(e) => setInputValue(e.target.value)}*/}
                        {/*    onKeyPress={handleKeyPress}*/}
                        {/*/>*/}

                        <Input
                            placeholder={uploadingFiles.length > 0 ? "Press Enter to send files" : "Type a message"}
                            className="flex-1 border-none bg-transparent text-gray-900 dark:text-white"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={uploadingFiles.length > 0}
                        />

                        {/*<Button*/}
                        {/*    variant="ghost"*/}
                        {/*    size="icon"*/}
                        {/*    onClick={() => fileInputRef.current?.click()}*/}
                        {/*    disabled={isUploading}*/}
                        {/*>*/}
                        {/*    <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400"/>*/}
                        {/*</Button>*/}

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="image/*,.pdf,.doc,.docx"
                        />

                        {/*<Button variant="ghost" size="icon"*/}
                        {/*        onClick={() => document.getElementById('file-upload')?.click()}>*/}
                        {/*    <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400"/>*/}
                        {/*</Button>*/}
                        {/*<input*/}
                        {/*    id="file-upload"*/}
                        {/*    type="file"*/}
                        {/*    className="hidden"*/}
                        {/*    onChange={handleFileUpload}*/}
                        {/*/>*/}
                        <Button variant="ghost" size="icon" onClick={handleSend} disabled={isUploading}>
                            <Send className="h-5 w-5 text-gray-500 dark:text-gray-400"/>
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center max-w-3xl mx-auto">
                        Trợ lý AI có thể có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.
                    </p>
                </div>
            </div>

            {/*/!* Popup for displaying key-value information *!/*/}
            {/*{isPopupOpen && (*/}
            {/*    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">*/}
            {/*        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">*/}
            {/*            <div className="flex justify-between items-center mb-4">*/}
            {/*                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{popupContent.title}</h3>*/}
            {/*                <Button variant="ghost" size="icon" onClick={() => setIsPopupOpen(false)}>*/}
            {/*                    <X className="h-6 w-6 text-gray-500 dark:text-gray-400"/>*/}
            {/*                </Button>*/}
            {/*            </div>*/}
            {/*            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-justify">{popupContent.content}</p>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}

            {/* Popup for displaying key-value information */}
            {isPopupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{popupContent.title}</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsPopupOpen(false)}>
                                <X className="h-6 w-6 text-gray-500 dark:text-gray-400"/>
                            </Button>
                        </div>
                        {/* Content area with scroll */}
                        <div className="max-h-64 overflow-y-auto">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-justify">
                                {popupContent.content}
                            </p>
                        </div>
                    </div>
                </div>
            )}


            {/* Feedback popup */}
            {isFeedbackOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Phản hồi người dùng</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsFeedbackOpen(false)}>
                                <X className="h-6 w-6 text-gray-500 dark:text-gray-400"/>
                            </Button>
                        </div>
                        <Textarea
                            placeholder="Type your feedback here..."
                            value={feedbackContent}
                            onChange={(e) => setFeedbackContent(e.target.value)}
                            className="w-full mb-4"
                        />
                        <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
                    </div>
                </div>
            )}
        </div>
    )
}