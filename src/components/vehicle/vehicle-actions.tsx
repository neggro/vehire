"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Pause,
  Play,
  Calendar,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateVehicleStatus, deleteVehicle } from "@/actions/vehicle";

interface VehicleActionsProps {
  vehicleId: string;
  vehicleName: string;
  status: string;
}

export function VehicleActions({ vehicleId, vehicleName, status }: VehicleActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handlePause = async () => {
    setIsLoading(true);
    try {
      const result = await updateVehicleStatus(vehicleId, "PAUSED");
      if (result.success) {
        toast({
          title: "Vehículo pausado",
          description: "El vehículo ha sido pausado y no aparecerá en las búsquedas",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo pausar el vehículo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      const result = await updateVehicleStatus(vehicleId, "ACTIVE");
      if (result.success) {
        toast({
          title: "Vehículo activado",
          description: "El vehículo está disponible para alquiler",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo activar el vehículo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteVehicle(vehicleId);
      if (result.success) {
        toast({
          title: "Vehículo eliminado",
          description: "El vehículo ha sido eliminado correctamente",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el vehículo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {status === "ACTIVE" && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/vehicle/${vehicleId}`}>
              <Eye className="mr-1 h-4 w-4" />
              Ver
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/host/vehicles/${vehicleId}/edit`}>
            <Pencil className="mr-1 h-4 w-4" />
            Editar
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/host/vehicles/${vehicleId}/availability`}>
                <Calendar className="mr-2 h-4 w-4" />
                Disponibilidad
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {status === "ACTIVE" ? (
              <DropdownMenuItem onClick={handlePause}>
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </DropdownMenuItem>
            ) : status === "PAUSED" ? (
              <DropdownMenuItem onClick={handleActivate}>
                <Play className="mr-2 h-4 w-4" />
                Activar
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar <strong>{vehicleName}</strong>. Esta acción
              no se puede deshacer. Se eliminarán todas las fotos y configuraciones
              asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
