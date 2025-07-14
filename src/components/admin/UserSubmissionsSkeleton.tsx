import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function UserSubmissionsSkeleton() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
       <div className="w-full max-w-6xl mb-4">
          <Skeleton className="h-10 w-48" />
       </div>
      <Card className="w-full max-w-6xl shadow-2xl">
        <CardHeader>
          <Skeleton className="h-9 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                  <TableHead className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableHead>
                  <TableHead className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-2/3" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-2/3" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
