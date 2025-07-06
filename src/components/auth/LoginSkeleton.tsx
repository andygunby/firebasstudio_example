import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoginSkeleton() {
  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader className="items-center gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-11 w-full" />
      </CardContent>
      <CardFooter className="flex justify-center">
        <Skeleton className="h-5 w-36" />
      </CardFooter>
    </Card>
  )
}
