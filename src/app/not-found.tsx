import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FileQuestion className="w-10 h-10 text-blue-600" />
                    </div>
                    <CardTitle className="text-6xl font-bold text-slate-300 mb-2">
                        404
                    </CardTitle>
                    <CardTitle className="text-xl text-slate-800">
                        Page Not Found
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                        The page you are looking for doesn&apos;t exist or has been moved.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        <Button
                            asChild
                            className="flex-1"
                            variant="default"
                        >
                            <Link href="/dashboard">
                                <Home className="w-4 h-4 mr-2" />
                                Go to Dashboard
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="flex-1"
                            variant="outline"
                        >
                            <Link href="javascript:history.back()">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Go Back
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
